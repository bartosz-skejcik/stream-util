package handlers

import "net/http"

func (h *Handlers) HandleChannelChange(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	newChannel := r.FormValue("channel")
	if newChannel == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Channel name is required")
		return
	}

	err := h.service.SetChannel(newChannel)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to connect to channel: "+err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusOK, "Channel changed successfully", nil)
}

func (h *Handlers) HandleGetChannel(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	channel := h.service.GetCurrentChannel()
	data := struct {
		Channel string `json:"channel"`
	}{
		Channel: channel,
	}
	h.sendSuccessResponse(w, http.StatusOK, "", data)
}

func (h *Handlers) HandleGetBroadcasterID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	username := r.URL.Query().Get("username")
	if username == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Username is required")
		return
	}

	id, err := h.service.GetBroadcasterID(username)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get broadcaster ID: "+err.Error())
		return
	}

	data := struct {
		ID string `json:"id"`
	}{
		ID: id,
	}

	h.sendSuccessResponse(w, http.StatusOK, "", data)
}
