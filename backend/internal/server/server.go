package server

import (
	"log"
	"net/http"
	"time"
	"twitch-client/internal/config"
	"twitch-client/internal/credentials"
	http_server "twitch-client/internal/server/http"
	"twitch-client/internal/server/middleware"
	socket "twitch-client/internal/server/websocket"
	"twitch-client/internal/service"
	"twitch-client/internal/service/auth"
)

type Server struct {
	service      *service.Service
	socket       *socket.WebSocket
	creds        *credentials.Credentials
	config       *config.Config
	cookieSecret []byte
}

func NewServer(svc *service.Service, ws *socket.WebSocket, c *credentials.Credentials, config *config.Config) *Server {

	return &Server{
		service: svc,
		socket:  ws,
		creds:   c,
		config:  config,
	}
}

func (s *Server) Run() {
	auth := auth.NewAuthService(s.creds, s.config)

	// WebSocket route without most middlewares since it needs different handling
	wsHandler := middleware.Chain(
		s.socket.ServeWs,
		middleware.Logger(),
		middleware.WebSocketCORS(),
	)

	http.HandleFunc("/ws", wsHandler)

	// Create your API middleware chain
	apiMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
		return middleware.Chain(
			handler,
			middleware.RequestID(),
			middleware.Logger(),
			middleware.Recover(),
			middleware.CORS([]string{"http://localhost:3000"}), // Add your frontend origins
			middleware.RateLimit(100, time.Minute),
			middleware.Compress(),
		)
	}

	server := http_server.NewServer(s.service, s.creds, auth, apiMiddleware)

	// Modify your server to accept the middleware
	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	} else {
		log.Println("Server started on port :42069")
	}
}
