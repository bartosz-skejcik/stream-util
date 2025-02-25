package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) HandleCredentials(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		client_id, oauth_token, err := h.credentials.Get()
		if err != nil {
			h.sendErrorResponse(w, http.StatusOK, "not_set")
			return
		}

		if client_id == "" || oauth_token == "" {
			h.sendErrorResponse(w, http.StatusOK, "not_set")
			return
		}

		h.sendSuccessResponse(w, http.StatusOK, "set", nil)
		break
	case http.MethodPut:
		var creds struct {
			ClientID   string `json:"client_id"`
			OAuthToken string `json:"oauth_token"`
		}

		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		h.credentials.Set(creds.ClientID, creds.OAuthToken)

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(Response{
			Message: "Credentials updated successfully",
			Error:   false,
		})
		break
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
}
