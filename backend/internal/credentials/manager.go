package credentials

import (
	"errors"
	"sync"
)

var (
	ErrNoCredentials = errors.New("no credentials set")
)

type CredentialsUpdate struct {
	ClientID   string
	OAuthToken string
}

type Credentials struct {
	clientID    string
	oauthToken  string
	mu          sync.RWMutex
	subscribers []chan CredentialsUpdate
}

func NewCredentialsManager() *Credentials {
	return &Credentials{
		subscribers: make([]chan CredentialsUpdate, 0),
	}
}

// Subscribe returns a channel that will receive credential updates
func (c *Credentials) Subscribe() chan CredentialsUpdate {
	c.mu.Lock()
	defer c.mu.Unlock()

	ch := make(chan CredentialsUpdate, 1) // Buffered channel to prevent blocking
	c.subscribers = append(c.subscribers, ch)

	// Send current credentials immediately if they exist
	if c.clientID != "" && c.oauthToken != "" {
		ch <- CredentialsUpdate{
			ClientID:   c.clientID,
			OAuthToken: c.oauthToken,
		}
	}

	return ch
}

// Unsubscribe removes a subscriber channel
func (c *Credentials) Unsubscribe(ch chan CredentialsUpdate) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for i, sub := range c.subscribers {
		if sub == ch {
			// Close the channel
			close(ch)
			// Remove it from subscribers
			c.subscribers = append(c.subscribers[:i], c.subscribers[i+1:]...)
			return
		}
	}
}

func (c *Credentials) Set(clientID, oauthToken string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.clientID = clientID
	c.oauthToken = oauthToken

	update := CredentialsUpdate{
		ClientID:   clientID,
		OAuthToken: oauthToken,
	}

	// Notify all subscribers of credential changes
	for _, ch := range c.subscribers {
		select {
		case ch <- update: // Try to send update
		default: // Skip if channel is full (shouldn't happen with buffered channels)
			continue
		}
	}
}

func (c *Credentials) Get() (string, string, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.clientID == "" || c.oauthToken == "" {
		return "", "", ErrNoCredentials
	}

	return c.clientID, c.oauthToken, nil
}
