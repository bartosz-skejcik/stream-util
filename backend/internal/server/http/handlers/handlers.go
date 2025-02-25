package handlers

import (
	"twitch-client/internal/credentials"
	"twitch-client/internal/service"
	"twitch-client/internal/service/auth"
	"twitch-client/internal/service/poll"
)

type Handlers struct {
	service     *service.Service
	pollService *poll.Service
	credentials *credentials.Credentials
	authService auth.AuthService
}

func New(s *service.Service, c *credentials.Credentials, a auth.AuthService) *Handlers {
	ps := poll.NewService()

	return &Handlers{
		service:     s,
		credentials: c,
		authService: a,
		pollService: &ps,
	}
}
