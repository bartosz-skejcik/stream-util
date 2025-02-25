package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func (h *Handlers) HandleCommands(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	commands, err := h.service.GetAllCommands()
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to fetch commands: "+err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusOK, "", commands)
}

func (h *Handlers) HandleAddCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Enabled     bool   `json:"enabled"`
		Response    string `json:"response"`
		Cooldown    int    `json:"cooldown_seconds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if req.Name == "" || req.Response == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Name and response are required")
		return
	}

	err := h.service.AddCommand(req.Name, req.Description, req.Response, req.Enabled, req.Cooldown)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to add command: "+err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusCreated, "Command added successfully", nil)
}

func (h *Handlers) HandleDeleteCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Command ID is required")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid command ID")
		return
	}

	err = h.service.DeleteCommand(id)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to delete command: "+err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusOK, "Command deleted successfully", nil)
}

func (h *Handlers) HandleUpdateCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		h.sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Enabled     bool   `json:"enabled"`
		Response    string `json:"response"`
		Cooldown    int    `json:"cooldown_seconds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if req.Name == "" || req.Response == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Name and response are required")
		return
	}

	command, err := h.service.UpdateCommand(req.ID, req.Name, req.Description, req.Response, req.Enabled, req.Cooldown)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to update command: "+err.Error())
		return
	}

	h.sendSuccessResponse(w, http.StatusOK, "Command updated successfully", command)
}
