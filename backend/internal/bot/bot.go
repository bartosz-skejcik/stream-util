package bot

import (
	"log"
	"twitch-client/internal/bot/handler"
	"twitch-client/internal/client"
	"twitch-client/internal/db"
	"twitch-client/internal/db/models"
	socket "twitch-client/internal/server/websocket"
	"twitch-client/internal/trends"

	twitchirc "github.com/gempir/go-twitch-irc/v4"
)

type Bot struct {
	tt             *trends.TrendTracker
	socket         *socket.WebSocket
	twitchClient   *client.Client
	db             *db.Database
	commandHandler *handler.CommandHandler
}

func NewBot(trendTracker *trends.TrendTracker, socket *socket.WebSocket, twitchClient *client.Client, db *db.Database) *Bot {
	b := &Bot{
		tt:           trendTracker,
		socket:       socket,
		twitchClient: twitchClient,
		db:           db,
	}
	b.commandHandler = handler.NewCommandHandler(db, twitchClient, socket, "!")

	return b
}

func (b *Bot) HandleMessage(message twitchirc.PrivateMessage) {
	username := message.User.Name
	emotes := message.Emotes

	if username == "nightbot" || username == "streamelements" {
		return
	}

	var emotesConverted []twitchirc.Emote
	for _, e := range emotes {
		emotesConverted = append(emotesConverted, *e)
	}

	b.commandHandler.HandleCommand(message)

	b.tt.TrackMessage(username, message.Message, emotesConverted)
	log.Printf("[%s] %s: %s", b.twitchClient.GetCurrentChannel(), username, message.Message)
}

func (b *Bot) GetAllCommands() ([]models.Command, error) {
	return b.commandHandler.GetAllCommands()
}
