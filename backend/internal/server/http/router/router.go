package router

import (
	"net/http"
	"twitch-client/internal/server/http/handlers"
	"twitch-client/internal/service/auth"
)

type Router struct {
	*handlers.Handlers
	middleware  func(http.HandlerFunc) http.HandlerFunc
	authService auth.AuthService
}

func New(h *handlers.Handlers, mw func(http.HandlerFunc) http.HandlerFunc, as auth.AuthService) *Router {
	return &Router{
		Handlers:    h,
		middleware:  mw,
		authService: as,
	}
}

func (r *Router) RegisterRoutes() {
	// Channel routes
	http.HandleFunc("/api/channel/change", r.middleware(r.HandleChannelChange))
	http.HandleFunc("/api/channel/get", r.middleware(r.HandleGetChannel))
	http.HandleFunc("/api/channel/broadcaster_id", r.middleware(r.HandleGetBroadcasterID))

	// Chat routes
	http.HandleFunc("/api/chat/send", r.middleware(r.HandleSendMessage))

	// Analytics routes
	http.HandleFunc("/api/trends", r.middleware(r.HandleGetTrends))
	http.HandleFunc("/api/users/top", r.middleware(r.HandleGetTopUsers))

	// Stream management routes
	http.HandleFunc("/api/stream/info", r.middleware(r.HandleStreamInfo))
	http.HandleFunc("/api/stream/update", r.middleware(r.HandleUpdateStream))

	// Commands routes
	http.HandleFunc("/api/commands", r.middleware(r.HandleCommands))
	http.HandleFunc("/api/commands/add", r.middleware(r.HandleAddCommand))
	http.HandleFunc("/api/commands/delete", r.middleware(r.HandleDeleteCommand))
	http.HandleFunc("/api/commands/update", r.middleware(r.HandleUpdateCommand))

	// Auth routes
	http.HandleFunc("/api/auth/login", r.middleware(r.authService.HandleLogin))
	http.HandleFunc("/api/auth/callback", r.middleware(r.authService.HandleOAuth2Callback))

	// Poll routes
	http.HandleFunc("/api/poll/status", r.middleware(r.HandlePollStatus))
	http.HandleFunc("/api/poll/create", r.middleware(r.HandleCreatePoll))
	http.HandleFunc("/api/poll/end", r.middleware(r.HandleEndPoll))
	http.HandleFunc("/api/poll/vote", r.middleware(r.HandleVote))
	http.HandleFunc("/api/poll/results", r.middleware(r.HandlePollResults))

	// Credentials routes
	http.HandleFunc("/api/credentials", r.middleware(r.HandleCredentials))

	// Index route
	http.HandleFunc("/", r.HandleIndex)
}
