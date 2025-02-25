package handlers

import (
	"net/http"
)

func (h *Handlers) HandlePollStatus(w http.ResponseWriter, r *http.Request) {

}
func (h *Handlers) HandleCreatePoll(w http.ResponseWriter, r *http.Request)  {}
func (h *Handlers) HandleEndPoll(w http.ResponseWriter, r *http.Request)     {}
func (h *Handlers) HandleVote(w http.ResponseWriter, r *http.Request)        {}
func (h *Handlers) HandlePollResults(w http.ResponseWriter, r *http.Request) {}
