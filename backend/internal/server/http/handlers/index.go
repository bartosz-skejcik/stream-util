package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) HandleIndex(w http.ResponseWriter, r *http.Request) {
	// get credentials
	client_id, oauth_token, err := h.credentials.Get()
	if err != nil {
		http.Error(w, "Failed to get credentials", http.StatusInternalServerError)
		return
	}

	// return the credentials as a json
	data := struct {
		ClientID   string `json:"client_id"`
		OAuthToken string `json:"oauth_token"`
	}{
		ClientID:   client_id,
		OAuthToken: oauth_token,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}
