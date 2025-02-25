package poll

import (
	"errors"
	"sync"
)

var (
	ErrPollNotStarted = errors.New("poll not started")
	Endpoint          = "https://api.twitch.tv/helix/polls"
)

type pollservice struct {
	ChannelPointsVoting  bool
	ChannelPointsPerVote int
	Duration             int
	Question             string
	Votes                map[string]int
	State                int
	mu                   sync.Mutex
}

type Service interface {
	HandleVote(username string, vote int) error
	Results() map[string]int
	StartPoll(question string)
	EndPoll()
}

func NewService() Service {
	return &pollservice{
		State: 0,
		Votes: make(map[string]int),
	}
}

func (p *pollservice) StartPoll(question string) {
	p.State = 1
	p.Question = question
}

func (p *pollservice) HandleVote(username string, vote int) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.State == 0 {
		return ErrPollNotStarted
	}

	p.Votes[username] = vote

	return nil
}

func (p *pollservice) Results() map[string]int {
	return p.Votes
}

func (p *pollservice) EndPoll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.State = 0
	p.Votes = make(map[string]int)
}
