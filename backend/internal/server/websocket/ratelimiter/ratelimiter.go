package ratelimiter

import (
	"sync"
	"time"
)

type RateLimiter interface {
	IsAllowed(username string) bool
}

// Keep your existing struct
type messageStore struct {
	lastMessages map[string]time.Time
	interval     time.Duration
	mu           sync.RWMutex
}

// Implement the new interface while using the struct
func (m *messageStore) IsAllowed(username string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	timestamp := time.Now()
	lastMessageTime, exists := m.lastMessages[username]

	if !exists || timestamp.Sub(lastMessageTime) > m.interval {
		m.lastMessages[username] = timestamp
		return true
	}

	return false
}

// Constructor returns the interface type
func NewRateLimiter(interval time.Duration) RateLimiter {
	return &messageStore{
		lastMessages: make(map[string]time.Time),
		interval:     interval * time.Second,
	}
}
