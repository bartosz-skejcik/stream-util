// file: trends/tracker.go
package trends

import (
	twitchirc "github.com/gempir/go-twitch-irc/v4"
	"regexp"
	"sort"
	"strings"
	"sync"
)

type UserEngagement struct {
	Username string `json:"username"`
	Messages int    `json:"messages"`
}

// Item represents a countable item with its frequency
type Item struct {
	Key   string `json:"key"` // can be emote, phrase, or username
	Count int    `json:"count"`
}

type TrendTracker struct {
	emotes   map[string]int
	phrases  map[string]int
	users    map[string]int
	mutex    sync.RWMutex
	maxItems int

	// Pre-compiled regex for better performance
	emoteRegex *regexp.Regexp
}

func NewTrendTracker(maxItems int) *TrendTracker {
	return &TrendTracker{
		emotes:     make(map[string]int),
		phrases:    make(map[string]int),
		users:      make(map[string]int),
		maxItems:   maxItems,
		emoteRegex: regexp.MustCompile(`\b[A-Z]{4,}\b`), // Only match emotes with 4+ characters
	}
}

// extractPhrases uses sliding window technique for better phrase extraction
func extractPhrases(words []string, emotes []twitchirc.Emote) []string {
	if len(words) < 2 {
		return nil
	}

	// filter out emotes from words
	var newWords []string
	for _, emote := range emotes {
		for _, word := range words {
			newWord := strings.ReplaceAll(word, emote.Name, "")
			newWords = append(newWords, newWord)
		}
	}
	words = newWords

	phrases := make([]string, 0, len(words)*2) // Pre-allocate for efficiency

	// Use a sliding window of size 2 and 3
	for i := 0; i < len(words)-1; i++ {
		// Skip common words or very short words
		if len(words[i]) <= 2 || isCommonWord(words[i]) {
			continue
		}

		// Two-word phrases
		if !isCommonWord(words[i+1]) {
			phrases = append(phrases, words[i]+" "+words[i+1])
		}

		// Three-word phrases
		if i < len(words)-2 && !isCommonWord(words[i+2]) {
			phrases = append(phrases, words[i]+" "+words[i+1]+" "+words[i+2])
		}
	}

	return phrases
}

// Common words to filter out for better phrase detection
var commonWords = map[string]bool{
	"the": true, "and": true, "is": true, "in": true, "to": true,
	"it": true, "of": true, "for": true, "on": true, "that": true,
	"at": true, "with": true, "be": true, "this": true, "was": true,
}

func isCommonWord(word string) bool {
	return commonWords[word]
}

func (t *TrendTracker) TrackMessage(username, message string, emotes []twitchirc.Emote) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	for _, emote := range emotes {
		t.emotes[emote.Name] += emote.Count
	}

	// Track user engagement
	t.users[username]++

	// Track phrases
	words := strings.Fields(strings.ToLower(message))
	phrases := extractPhrases(words, emotes)
	for _, phrase := range phrases {
		t.phrases[phrase]++
	}

	// Implement maxItems limit for maps to prevent unbounded growth
	t.enforceMaxItems()
}

func (t *TrendTracker) enforceMaxItems() {
	if len(t.emotes) > t.maxItems {
		t.pruneMap(t.emotes)
	}
	if len(t.phrases) > t.maxItems {
		t.pruneMap(t.phrases)
	}
	if len(t.users) > t.maxItems {
		t.pruneMap(t.users)
	}
}

// pruneMap removes the least frequent items when map exceeds maxItems
func (t *TrendTracker) pruneMap(m map[string]int) {
	items := make([]Item, 0, len(m))
	for k, v := range m {
		items = append(items, Item{Key: k, Count: v})
	}

	// Sort by count in descending order
	sort.Slice(items, func(i, j int) bool {
		return items[i].Count > items[j].Count
	})

	// Clear map and keep only top items
	for k := range m {
		delete(m, k)
	}

	// Restore top items
	for i := 0; i < t.maxItems && i < len(items); i++ {
		m[items[i].Key] = items[i].Count
	}
}

// Generic function to get top N items from a map
func (t *TrendTracker) getTopN(m map[string]int, n int) []Item {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	items := make([]Item, 0, len(m))
	for k, v := range m {
		items = append(items, Item{Key: k, Count: v})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Count > items[j].Count
	})

	if n > len(items) {
		n = len(items)
	}
	return items[:n]
}

func (t *TrendTracker) GetTopEmotes(n int) []Item {
	return t.getTopN(t.emotes, n)
}

func (t *TrendTracker) GetTopPhrases(n int) []Item {
	return t.getTopN(t.phrases, n)
}

func (t *TrendTracker) GetTopUsers(n int) []UserEngagement {
	items := t.getTopN(t.users, n)
	users := make([]UserEngagement, len(items))
	for i, item := range items {
		users[i] = UserEngagement{
			Username: item.Key,
			Messages: item.Count,
		}
	}
	return users
}
