package handlers

import "net/http"

func (h *Handlers) HandleSendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	message := r.FormValue("message")
	if message == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Message is required")
		return
	}

	err := h.service.SendMessage(message)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to send message: "+err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusOK, "Message sent successfully", nil)
}
