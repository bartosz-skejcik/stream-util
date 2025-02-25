// file: internal/server/websocket/websocket.go
package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	// "regexp"
	"sync"
	"time"
	"twitch-client/internal/server/websocket/ratelimiter"

	"github.com/gorilla/websocket"
)

type Event string

const (
	UserJoinEvent Event = "user_join"
	UserPartEvent Event = "user_part"
	MessageEvent  Event = "message"
)

// Message represents a message with a timestamp, username, and content.
type Message struct {
	Type      Event       `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}

type UserMessage struct {
	Username string `json:"username"`
	Color    string `json:"color"`
	Content  string `json:"content"`
}

type UserJoinMessage struct {
	Username string `json:"username"`
}

// Client represents a single WebSocket connection.
type Client struct {
	socket *WebSocket
	conn   *websocket.Conn
	send   chan []byte
}

// WebSocket maintains the set of active clients and broadcasts messages.
type WebSocket struct {
	// Registered clients.
	clients map[*Client]bool

	// Channel for incoming broadcast messages.
	broadcast chan []byte

	// Channel for registering new clients.
	register chan *Client

	// Channel for unregistering clients.
	unregister chan *Client

	// Mutex to protect the clients map.
	mu sync.RWMutex

	Ratelimiter ratelimiter.RateLimiter
}

// NewWebSocket creates and returns a new Hub.
func NewWebSocket(rl *ratelimiter.RateLimiter) *WebSocket {
	return &WebSocket{
		clients:     make(map[*Client]bool),
		broadcast:   make(chan []byte),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		Ratelimiter: *rl,
	}
}

// Run starts the hub's main loop, handling register, unregister, and broadcast requests.
func (ws *WebSocket) Run() {
	for {
		select {
		case client := <-ws.register:
			ws.mu.Lock()
			ws.clients[client] = true
			ws.mu.Unlock()
		case client := <-ws.unregister:
			ws.mu.Lock()
			if _, ok := ws.clients[client]; ok {
				delete(ws.clients, client)
				close(client.send)
			}
			ws.mu.Unlock()
		case message := <-ws.broadcast:
			ws.mu.RLock()
			for client := range ws.clients {
				select {
				case client.send <- message:
					// message sent
				default:
					// If client's send buffer is full, remove the client.
					close(client.send)
					delete(ws.clients, client)
				}
			}
			ws.mu.RUnlock()
		}
	}
}

// BroadcastMessage sends a raw message (as a byte slice) to all connected clients.
func (ws *WebSocket) BroadcastMessage(message []byte) {
	ws.broadcast <- message
}

func (ws *WebSocket) BroadcastUserPartMessage(username string) {
	msg := Message{
		Type:      UserPartEvent,
		Timestamp: time.Now(),
		Data: UserJoinMessage{
			Username: username,
		},
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	ws.BroadcastMessage(data)
}

func (ws *WebSocket) BroadcastUserJoinMessage(username string) {
	msg := Message{
		Type:      UserJoinEvent,
		Timestamp: time.Now(),
		Data: UserJoinMessage{
			Username: username,
		},
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	ws.BroadcastMessage(data)
}

// BroadcastUserMessage creates a Message with the current timestamp, username, and content,
// marshals it into JSON, and broadcasts it to all connected clients.
func (ws *WebSocket) BroadcastUserMessage(username, color, content string) {
	if !ws.Ratelimiter.IsAllowed(username) {
		log.Printf("User %s is sending messages too quickly", username)
		return
	}

	// remove all non-ascii characters from the content
	// re := regexp.MustCompile(`[^x20-\x7E]`)
	// content = re.ReplaceAllString(content, "")

	msg := Message{
		Timestamp: time.Now(),
		Type:      MessageEvent,
		Data: UserMessage{
			Username: username,
			Color:    color,
			Content:  content,
		},
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	ws.BroadcastMessage(data)
}

// upgrader is used to upgrade an HTTP connection to a WebSocket connection.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// For simplicity, allow all origins. In production, validate the origin.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ServeWs upgrades the HTTP server connection to the WebSocket protocol and registers the client.
func (ws *WebSocket) ServeWs(w http.ResponseWriter, r *http.Request) {
	log.Println("WebSocket connection requested.")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	client := &Client{
		socket: ws,
		conn:   conn,
		send:   make(chan []byte, 256),
	}
	ws.register <- client

	// Launch goroutines for reading and writing messages.
	go client.writePump()
	go client.readPump()
}

// Constants for timeouts and message size limits.
const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

// readPump pumps messages from the WebSocket connection to the hub.
// It also handles client disconnect.
func (c *Client) readPump() {
	defer func() {
		c.socket.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("readPump error: %v", err)
			}
			break
		}
		// Optionally, process or log the message from the client.
		// For example, you might choose to broadcast messages received from one client:
		c.socket.BroadcastMessage(message)
	}
}

// writePump pumps messages from the hub to the WebSocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Send each message individually instead of batching
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

			// Process any queued messages
			n := len(c.send)
			for i := 0; i < n; i++ {
				message := <-c.send
				if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
					return
				}
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
