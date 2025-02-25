// file: main.go
package main

import (
	"encoding/json"
	"log"
	"twitch-client/internal/bot"
	twitch "twitch-client/internal/client"
	"twitch-client/internal/config"
	"twitch-client/internal/credentials"
	"twitch-client/internal/db"
	"twitch-client/internal/server"
	socket "twitch-client/internal/server/websocket"
	"twitch-client/internal/server/websocket/ratelimiter"
	"twitch-client/internal/service"
	"twitch-client/internal/trends"

	twitchirc "github.com/gempir/go-twitch-irc/v4"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	db, err := db.NewPostgresDB(cfg)
	if err != nil {
		panic(err)
	}

	err = db.ApplyMigrations()
	if err != nil {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	rl := ratelimiter.NewRateLimiter(30)

	creds := credentials.NewCredentialsManager()

	soc := socket.NewWebSocket(&rl)
	trendTracker := trends.NewTrendTracker(100)
	twitchClient := twitch.NewClient(creds, nil)
	defer twitchClient.Close() // Important: clean up subscription

	go soc.Run()

	b := bot.NewBot(trendTracker, soc, twitchClient, db)

	twitchClient.MessageHandler = b.HandleMessage

	svc := service.NewService(twitchClient, trendTracker, cfg, db, creds, b)
	serv := server.NewServer(svc, soc, creds, cfg)

	twitchClient.MessageInterceptor = svc.InterceptMessage

	twitchClient.OnUserJoin = func(message twitchirc.UserJoinMessage) {
		stringMessage, err := json.Marshal(message)
		if err != nil {
			log.Printf("Failed to marshal user join message: %v", err)
		}
		log.Printf("User joined: %s", stringMessage)
		soc.BroadcastUserJoinMessage(message.User)
	}

	twitchClient.OnUserPart = func(message twitchirc.UserPartMessage) {
		stringMessage, err := json.Marshal(message)
		if err != nil {
			log.Printf("Failed to marshal user part message: %v", err)
		}

		log.Printf("User left: %s", stringMessage)
		soc.BroadcastUserPartMessage(message.User)
	}

	serv.Run()
}
