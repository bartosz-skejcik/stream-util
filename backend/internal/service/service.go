package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"twitch-client/internal/bot"
	"twitch-client/internal/client"
	"twitch-client/internal/config"
	"twitch-client/internal/credentials"
	"twitch-client/internal/db"
	"twitch-client/internal/db/models"
	"twitch-client/internal/trends"

	"github.com/gempir/go-twitch-irc/v4"
)

type EmoteResponse struct {
	Emote string `json:"emote"`
	Count int    `json:"count"`
}

type PhraseResponse struct {
	Phrase string `json:"phrase"`
	Count  int    `json:"count"`
}

type BanResponse struct {
	Data []struct {
		BroadcasterID string      `json:"broadcaster_id"`
		ModeratorID   string      `json:"moderator_id"`
		UserID        string      `json:"user_id"`
		CreatedAt     time.Time   `json:"created_at"`
		EndTime       interface{} `json:"end_time"`
	} `json:"data"`
}

type UserInfo struct {
	ID              string    `json:"id"`
	Login           string    `json:"login"`
	DisplayName     string    `json:"display_name"`
	Type            string    `json:"type"`
	BroadcasterType string    `json:"broadcaster_type"`
	Description     string    `json:"description"`
	ProfileImageURL string    `json:"profile_image_url"`
	OfflineImageURL string    `json:"offline_image_url"`
	ViewCount       int       `json:"view_count"`
	CreatedAt       time.Time `json:"created_at"`
}

type UserInfoResponse struct {
	Data []UserInfo `json:"data"`
}

type StreamInfo struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	UserLogin    string    `json:"user_login"`
	UserName     string    `json:"user_name"`
	GameID       string    `json:"game_id"`
	GameName     string    `json:"game_name"`
	Type         string    `json:"type"`
	Title        string    `json:"title"`
	ViewerCount  int       `json:"viewer_count"`
	StartedAt    time.Time `json:"started_at"`
	Language     string    `json:"language"`
	ThumbnailURL string    `json:"thumbnail_url"`
	TagIds       []any     `json:"tag_ids"`
	Tags         []string  `json:"tags"`
	IsMature     bool      `json:"is_mature"`
}

type StreamInfoResponse struct {
	Data       []StreamInfo `json:"data"`
	Pagination struct {
		Cursor string `json:"cursor"`
	} `json:"pagination"`
}

type Service struct {
	twitchClient *client.Client
	trendTracker *trends.TrendTracker
	config       *config.Config
	db           *db.Database
	credentials  *credentials.Credentials
	bot          *bot.Bot
}

func NewService(twitchClient *client.Client, trendTracker *trends.TrendTracker, cfg *config.Config, db *db.Database, creds *credentials.Credentials, b *bot.Bot) *Service {
	svc := &Service{
		twitchClient: twitchClient,
		trendTracker: trendTracker,
		config:       cfg,
		db:           db,
		credentials:  creds,
		bot:          b,
	}

	return svc
}

func (s *Service) InterceptMessage(message twitch.PrivateMessage) {
	if message.FirstMessage && strings.Contains(message.Message, "remove the space") {
		// ban the guy
		s.BanUser(message.User.Name)
	}

	// add more message interceptors here
}

func (s *Service) BanUser(username string) error {
	clientID, oauthToken, err := s.credentials.Get()
	if err != nil {
		return fmt.Errorf("failed to get credentials: %w", err)
	}

	broadcasterID, err := s.GetBroadcasterID(s.twitchClient.GetCurrentChannel())
	if err != nil {
		return fmt.Errorf("failed to get broadcaster ID: %w", err)
	}

	userInfo, err := s.GetUserInfo(username)

	query_params := fmt.Sprintf("broadcaster_id=%s&moderator_id=%s", broadcasterID, broadcasterID)

	url := fmt.Sprintf("https://api.twitch.tv/helix/moderation/bans?%s", query_params)

	body := struct {
		UserID string `json:"user_id"`
		Reason string `json:"reason"`
	}{
		UserID: userInfo.ID,
		Reason: "Banned by bot",
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Client-ID", clientID)
	req.Header.Set("Authorization", "Bearer "+oauthToken)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response BanResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	return nil
}

func (s *Service) GetUserInfo(username string) (UserInfo, error) {
	clientID, oauthToken, err := s.credentials.Get()
	if err != nil {
		return UserInfo{}, fmt.Errorf("failed to get credentials: %w", err)
	}

	// get the user_id based on username to ban
	url := fmt.Sprintf("https://api.twitch.tv/helix/users?login=%s", username)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return UserInfo{}, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Client-Id", clientID)
	req.Header.Set("Authorization", "Bearer "+oauthToken)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return UserInfo{}, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return UserInfo{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response UserInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return UserInfo{}, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(response.Data) == 0 {
		return UserInfo{}, fmt.Errorf("no user found with login: %s", username)
	}

	return response.Data[0], nil
}

func (s *Service) SendMessage(message string) error {
	return s.twitchClient.SendMessage(message)
}

func (s *Service) SetChannel(channelName string) error {
	return s.twitchClient.Connect(channelName)
}

func (s *Service) GetCurrentChannel() string {
	return s.twitchClient.GetCurrentChannel()
}

func (s *Service) GetTrends() (emotesResp []EmoteResponse, phrasesResp []PhraseResponse) {
	topEmotes := s.trendTracker.GetTopEmotes(10)
	topPhrases := s.trendTracker.GetTopPhrases(10)

	emotesResp = make([]EmoteResponse, len(topEmotes))
	for i, item := range topEmotes {
		emotesResp[i] = EmoteResponse{
			Emote: item.Key,
			Count: item.Count,
		}
	}

	phrasesResp = make([]PhraseResponse, len(topPhrases))
	for i, item := range topPhrases {
		phrasesResp[i] = PhraseResponse{
			Phrase: item.Key,
			Count:  item.Count,
		}
	}

	log.Printf("=============[ Trends ]=============\n%v\n%v\n====================================\n", emotesResp, phrasesResp)

	return emotesResp, phrasesResp
}

func (s *Service) GetTopUsers() []trends.UserEngagement {
	topUsers := s.trendTracker.GetTopUsers(10)

	return topUsers
}

func (s *Service) GetStreamInfo(channelName string) (StreamInfo, error) {
	clientID, oauthToken, err := s.credentials.Get()
	if err != nil {
		return StreamInfo{}, fmt.Errorf("failed to get credentials: %w", err)
	}

	// Create the request URL
	log.Printf("Fetching info for channel: %s\n", channelName)
	url := fmt.Sprintf("https://api.twitch.tv/helix/streams?user_login=%s", channelName)

	// Create a new GET request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return StreamInfo{}, fmt.Errorf("failed to create request: %w", err)
	}

	// Set required headers
	req.Header.Set("Client-ID", clientID)
	req.Header.Set("Authorization", "Bearer "+oauthToken)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return StreamInfo{}, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Check for successful response
	if resp.StatusCode != http.StatusOK {
		return StreamInfo{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Parse the response
	var streamResponse StreamInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&streamResponse); err != nil {
		return StreamInfo{}, fmt.Errorf("failed to decode response: %w", err)
	}

	// Check if we got any data
	if len(streamResponse.Data) == 0 {
		return StreamInfo{}, fmt.Errorf("no stream data found for channel: %s", channelName)
	}

	// Return the first stream info
	return streamResponse.Data[0], nil
}

func (s *Service) UpdateStreamInfo(broadcasterID, title, gameID string, tags []string) error {
	url := fmt.Sprintf("https://api.twitch.tv/helix/channels?broadcaster_id=%s", broadcasterID)

	// Prepare request body
	body := struct {
		Title  string   `json:"title,omitempty"`
		GameID string   `json:"game_id,omitempty"`
		Tags   []string `json:"tags,omitempty"`
	}{
		Title:  title,
		GameID: gameID,
		Tags:   tags,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create request
	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Client-ID", s.config.TwitchClientID)
	req.Header.Set("Authorization", "Bearer "+s.config.TwitchOAuthToken)
	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (s *Service) GetBroadcasterID(username string) (string, error) {
	url := fmt.Sprintf("https://api.twitch.tv/helix/users?login=%s", username)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Client-ID", s.config.TwitchClientID)
	req.Header.Set("Authorization", "Bearer "+s.config.TwitchOAuthToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(response.Data) == 0 {
		return "", fmt.Errorf("no user found with login: %s", username)
	}

	return response.Data[0].ID, nil
}

func (s *Service) GetAllCommands() ([]models.Command, error) {
	return s.bot.GetAllCommands()
}

func (s *Service) AddCommand(name, description, response string, enabled bool, cooldown int) error {
	cmd := &models.Command{
		Name:            name,
		Description:     description,
		Response:        response,
		Enabled:         enabled,
		CooldownSeconds: cooldown,
	}

	return s.db.CreateCommand(cmd)
}

func (s *Service) UpdateCommand(id int, name, description, response string, enabled bool, cooldown int) (*models.Command, error) {
	cmd := &models.Command{
		ID:              id,
		Name:            name,
		Description:     description,
		Response:        response,
		Enabled:         enabled,
		CooldownSeconds: cooldown,
	}

	return s.db.UpdateCommand(cmd)
}

func (s *Service) DeleteCommand(id int) error {
	return s.db.DeleteCommand(id)
}
