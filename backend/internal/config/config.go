package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	// Twitch
	TwitchClientID     string
	TwitchClientSecret string
	TwitchOAuthToken   string
	TwitchRefreshToken string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

func LoadConfig() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		return nil, err
	}

	config := &Config{
		TwitchClientID:     os.Getenv("TWITCH_CLIENT_ID"),
		TwitchClientSecret: os.Getenv("TWITCH_CLIENT_SECRET"),
		TwitchOAuthToken:   os.Getenv("TWITCH_OAUTH_TOKEN"),
		TwitchRefreshToken: os.Getenv("TWITCH_REFRESH_TOKEN"),
		DBHost:             os.Getenv("DB_HOST"),
		DBPort:             os.Getenv("DB_PORT"),
		DBUser:             os.Getenv("DB_USER"),
		DBPassword:         os.Getenv("DB_PASSWORD"),
		DBName:             os.Getenv("DB_NAME"),
	}

	return config, nil
}
