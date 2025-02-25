package http_server

import (
	"net/http"
	"twitch-client/internal/credentials"
	"twitch-client/internal/server/http/handlers"
	"twitch-client/internal/server/http/router"
	"twitch-client/internal/service"
	"twitch-client/internal/service/auth"
)

type Server struct {
	router *router.Router
}

func NewServer(s *service.Service, c *credentials.Credentials, a auth.AuthService, mw func(http.HandlerFunc) http.HandlerFunc) *Server {
	h := handlers.New(s, c, a)
	r := router.New(h, mw, a)

	return &Server{
		router: r,
	}
}

func (s *Server) Start() error {
	s.router.RegisterRoutes()
	return http.ListenAndServe(":42069", nil)
}
