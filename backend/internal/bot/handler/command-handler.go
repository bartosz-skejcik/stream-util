package handler

import (
	"fmt"
	"log"
	"strings"
	"sync"
	"time"
	"twitch-client/internal/client"
	"twitch-client/internal/db"
	"twitch-client/internal/db/models"
	"twitch-client/internal/server/websocket"

	twitchirc "github.com/gempir/go-twitch-irc/v4"
)

// CustomCommand represents a custom command that can only be created on the server
type CustomCommand struct {
	Name            string                                   `json:"name"`
	Description     string                                   `json:"description"`
	Response        string                                   `json:"response"`
	function        func([]string, twitchirc.PrivateMessage) `json:"-"` // Remove or fix the tag
	CoolDownSeconds int                                      `json:"cooldown_seconds"`
}

type CommandHandler struct {
	db             *db.Database
	twitchClient   *client.Client
	socket         *websocket.WebSocket
	cooldowns      map[string]map[string]time.Time // command -> user -> last used
	mu             sync.Mutex
	prefix         string
	customCommands map[string]CustomCommand
}

func NewCommandHandler(db *db.Database, twitchClient *client.Client, socket *websocket.WebSocket, prefix string) *CommandHandler {
	ch := &CommandHandler{
		db:             db,
		twitchClient:   twitchClient,
		socket:         socket,
		cooldowns:      make(map[string]map[string]time.Time),
		prefix:         prefix,
		customCommands: make(map[string]CustomCommand),
	}
	ch.registerCustomCommands()
	return ch
}

func (h *CommandHandler) registerCustomCommands() {
	// Custom !tts command handler
	h.customCommands["tts"] = CustomCommand{
		Name:        "tts",
		Description: "Text to speech",
		Response:    "-",
		function: func(args []string, msg twitchirc.PrivateMessage) {
			if len(args) == 0 {
				msg := fmt.Sprintf("@%s, musisz podać wiadomość do wyemitowania.\nnp. !tts siema chat :D", msg.User.Name)
				h.twitchClient.SendMessage(msg)
				return // No message to broadcast
			}

			color := msg.User.Color
			if color == "" {
				color = "#fff"
			}

			text := strings.Join(args, " ")
			h.socket.BroadcastUserMessage(msg.User.Name, color, text)
		},
		CoolDownSeconds: 10,
	}

	// usage !editcom <command> <response>
	h.customCommands["editcom"] = CustomCommand{
		Name:        "editcom",
		Description: "Edit a command",
		Response:    "-",
		function: func(args []string, msg twitchirc.PrivateMessage) {
			if len(args) == 0 {
				return
			}

			// check if the user is a moderator

			if msg.User.Badges["moderator"] == 0 && msg.User.Badges["broadcaster"] == 0 {
				msg := fmt.Sprintf("@%s, nie masz uprawnień do korzystania z tego polecenia", msg.User.Name)
				h.twitchClient.SendMessage(msg)
				return
			}

			if len(args) < 2 {
				msg := fmt.Sprintf("@%s, nie podałeś komendy lub odpowiedzi", msg.User.Name)
				h.twitchClient.SendMessage(msg)
				return
			}

			cmdName := args[0]
			cmdResponse := strings.Join(args[1:], " ")

			cmd, err := h.db.GetCommandByName(cmdName)
			if err != nil {
				msg := fmt.Sprintf("@%s, komenda '%s' nie istnieje", msg.User.Name, cmdName)
				h.twitchClient.SendMessage(msg)
				return
			}

			cmd.Response = cmdResponse
			if _, err := h.db.UpdateCommand(&cmd); err != nil {
				msg := fmt.Sprintf("@%s, nie udało się zaktualizować komendy '%s'", msg.User.Name, cmdName)
				h.twitchClient.SendMessage(msg)
				return
			}

			response := fmt.Sprintf("@%s, komenda '%s' została zaktualizowana", msg.User.Name, cmdName)
			h.twitchClient.SendMessage(response)
		},
	}

	h.customCommands["commands"] = CustomCommand{
		Name:        "commands",
		Description: "List all available commands",
		Response:    "-",
		function: func(args []string, msg twitchirc.PrivateMessage) {
			commands, err := h.GetAllCommands()
			if err != nil {
				log.Printf("Failed to get commands: %v", err)
				return
			}

			var response strings.Builder
			response.WriteString("Dostępne komendy:")
			for i, cmd := range commands {
				msg := fmt.Sprintf("\n\n%d. %s -> %s", i+1, cmd.Name, cmd.Description)
				response.WriteString(msg)
			}

			fmt.Println(response.String())

			h.twitchClient.SendMessage(response.String())
		},
	}
}

func (h *CommandHandler) HandleCommand(msg twitchirc.PrivateMessage) {
	if !strings.HasPrefix(msg.Message, h.prefix) {
		return
	}

	parts := strings.Fields(msg.Message)
	if len(parts) == 0 {
		log.Println("Empty command")
		return
	}

	fullCommand := strings.TrimPrefix(parts[0], h.prefix)
	args := parts[1:]

	// Check custom commands first
	if handler, exists := h.customCommands[fullCommand]; exists {
		handler.function(args, msg)
		return
	}

	// Handle database commands
	commands, err := h.db.GetAllCommands()
	if err != nil {
		log.Printf("Failed to get commands: %v", err)
		return
	}

	var cmd *models.Command
	for i := range commands {
		if commands[i].Name == fullCommand {
			cmd = &commands[i]
			break
		}
	}

	if cmd == nil || !cmd.Enabled {
		return
	}

	// Check cooldown
	h.mu.Lock()
	defer h.mu.Unlock()

	if cmd.CooldownSeconds > 0 {
		userLastUsed, exists := h.cooldowns[cmd.Name][msg.User.Name]
		if exists {
			cooldownEnd := userLastUsed.Add(time.Duration(cmd.CooldownSeconds) * time.Second)
			if time.Now().Before(cooldownEnd) && msg.User.Badges["broadcaster"] != 1 {
				// get the time left on the cooldown
				remaining := cooldownEnd.Sub(time.Now())
				msg := fmt.Sprintf("@%s, komenda '%s' jest na cooldown'ie. Pozostało %s", msg.User.Name, cmd.Name, remaining)
				h.twitchClient.SendMessage(msg)
				return
			}
		}
	}

	// Process command response
	response := h.replacePlaceholders(cmd.Response, msg.User.Name, args)
	if msg.Channel != "" {
		h.twitchClient.SendMessage(response)
	}

	// Update cooldown
	if cmd.CooldownSeconds > 0 {
		if h.cooldowns[cmd.Name] == nil {
			h.cooldowns[cmd.Name] = make(map[string]time.Time)
		}
		h.cooldowns[cmd.Name][msg.User.Name] = time.Now()
	}
}

func (h *CommandHandler) replacePlaceholders(response, username string, args []string) string {
	replaced := strings.ReplaceAll(response, "${user}", username)
	return strings.ReplaceAll(replaced, "${args}", strings.Join(args, " "))
}

func (h *CommandHandler) GetAllCommands() ([]models.Command, error) {
	cmds, err := h.db.GetAllCommands()
	if err != nil {
		return nil, err
	}

	cmds = append(cmds, h.customCommandsToModels()...)

	return cmds, nil
}

func (h *CommandHandler) customCommandsToModels() []models.Command {
	var cmds []models.Command
	for _, cmd := range h.customCommands {
		cmds = append(cmds, models.Command{
			Name:            cmd.Name,
			Description:     cmd.Description,
			Response:        cmd.Response,
			Enabled:         true,
			CooldownSeconds: cmd.CoolDownSeconds,
		})
	}
	return cmds
}
