package handlers

import (
	"net/http"
	"twitch-client/internal/service"
)

func (h *Handlers) HandleGetTrends(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	emotesResp, phrasesResp := h.service.GetTrends()
	data := struct {
		Emotes  []service.EmoteResponse  `json:"emotes"`
		Phrases []service.PhraseResponse `json:"phrases"`
	}{
		Emotes:  emotesResp,
		Phrases: phrasesResp,
	}

	h.sendSuccessResponse(w, http.StatusOK, "", data)
}

func (h *Handlers) HandleGetTopUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	users := h.service.GetTopUsers()
	h.sendSuccessResponse(w, http.StatusOK, "", users)
}
