// file: client/twitch.go
package client

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"
	"twitch-client/internal/credentials"

	twitchirc "github.com/gempir/go-twitch-irc/v4"
)

type Client struct {
	Client             *twitchirc.Client
	currentChannel     string
	mutex              sync.Mutex
	OnUserJoin         func(message twitchirc.UserJoinMessage)
	OnUserPart         func(message twitchirc.UserPartMessage)
	MessageHandler     func(message twitchirc.PrivateMessage)
	MessageInterceptor func(message twitchirc.PrivateMessage)
	credentials        *credentials.Credentials
	credsChan          chan credentials.CredentialsUpdate
}

func NewClient(c *credentials.Credentials, messageHandler func(message twitchirc.PrivateMessage)) *Client {
	client := &Client{
		MessageHandler: messageHandler,
		credentials:    c,
		mutex:          sync.Mutex{},
		credsChan:      c.Subscribe(), // Subscribe to credential updates
		OnUserJoin:     func(message twitchirc.UserJoinMessage) {},
		OnUserPart:     func(message twitchirc.UserPartMessage) {},
	}

	// Start goroutine to handle credential updates
	go client.handleCredentialUpdates()

	return client
}

func (c *Client) handleCredentialUpdates() {
	// for update := range c.credsChan {
	for range c.credsChan {

		if c.currentChannel != "" {
			if err := c.Connect(c.currentChannel); err != nil {
				log.Printf("Error reconnecting with new credentials: %v", err)
			}
		}
	}
}

func (c *Client) Close() {
	c.credentials.Unsubscribe(c.credsChan)
}

func (c *Client) Connect(channel string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Get current credentials
	clientID, oauthToken, err := c.credentials.Get()
	if err != nil {
		return err
	}

	if c.Client != nil {
		if err := c.Client.Disconnect(); err != nil {
			log.Printf("Error disconnecting from previous channel: %v", err)
		}
	}

	// Use the bot's username and OAuth token
	c.Client = twitchirc.NewClient(clientID, fmt.Sprintf("oauth:%s", oauthToken))
	c.currentChannel = channel

	log.Printf("Creating new client for channel: %s", channel)

	c.Client.OnPrivateMessage(func(message twitchirc.PrivateMessage) {
		c.MessageInterceptor(message)
		c.updateMessagesLog(message)
		c.MessageHandler(message)
	})

	c.Client.OnUserJoinMessage(func(message twitchirc.UserJoinMessage) {
		c.OnUserJoin(message)
	})

	c.Client.OnUserPartMessage(func(message twitchirc.UserPartMessage) {
		c.OnUserPart(message)
	})

	c.Client.OnNamesMessage(func(message twitchirc.NamesMessage) {
		content, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error marshalling names message: %v", err)
		}
		log.Printf("New names message: %s", content)
	})

	// c.Client

	c.Client.Join(channel)

	go func() {
		for i := 0; i < 5; i++ {
			log.Printf("Attempting to connect to channel %s (attempt %d)", channel, i+1)
			err := c.Client.Connect()
			if err == nil {
				log.Printf("Successfully connected to channel: %s", channel)
				return
			} else {
				log.Printf("Error connecting to Twitch: %v", err)
			}
			time.Sleep(time.Second * 2)
		}
		log.Println("Failed to connect after 5 attempts")
	}()

	return nil
}

func (c *Client) GetCurrentChannel() string {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	return c.currentChannel
}

// function to log the message to log.json
func (c *Client) updateMessagesLog(message twitchirc.PrivateMessage) error {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshalling message: %v", err)
	}

	// add the message to the log file while still keeping the previous messages
	f, err := os.OpenFile("log.json", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Error opening log file: %v", err)
	}
	defer f.Close()

	if _, err := f.Write(append(data, '\n')); err != nil {
		log.Printf("Error writing to log file: %v", err)
	}

	return nil
}

func (c *Client) SendMessage(message string) error {
	c.Client.Say(c.currentChannel, message)

	return nil
}

func (c *Client) Reply(message string, replyTo twitchirc.PrivateMessage) error {
	c.SendMessage(fmt.Sprintf("@%s, %s", replyTo.User.Name, message))

	return nil
}
