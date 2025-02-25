package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) HandleStreamInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	channel := r.URL.Query().Get("channel")
	info, err := h.service.GetStreamInfo(channel)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusOK, "", info)
}

func (s *Handlers) HandleUpdateStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Title  string   `json:"title"`
		GameID string   `json:"game_id"`
		Tags   []string `json:"tags"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	broadcasterID := r.URL.Query().Get("user_id")
	if broadcasterID == "" {
		s.sendErrorResponse(w, http.StatusUnauthorized, "Unauthorized: missing broadcaster ID")
		return
	}

	err := s.service.UpdateStreamInfo(broadcasterID, req.Title, req.GameID, req.Tags)
	if err != nil {
		s.sendErrorResponse(w, http.StatusInternalServerError, "Failed to update stream info: "+err.Error())
		return
	}

	s.sendSuccessResponse(w, http.StatusOK, "Stream info updated successfully", nil)
}
