package handlers

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Message string      `json:"message"`
	Error   bool        `json:"error"`
	Data    interface{} `json:"data"`
}

// Utility functions
func (h *Handlers) sendErrorResponse(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Message: message,
		Error:   true,
		Data:    nil,
	})
}

func (h *Handlers) sendSuccessResponse(w http.ResponseWriter, status int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Message: message,
		Error:   false,
		Data:    data,
	})
}
