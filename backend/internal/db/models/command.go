package models

import (
	"time"
)

type Command struct {
	ID              int       `db:"id" json:"id"`
	Name            string    `db:"name" json:"name"`
	Description     string    `db:"description" json:"description"`
	Response        string    `db:"response" json:"response"`
	Enabled         bool      `db:"enabled" json:"enabled"`
	CooldownSeconds int       `db:"cooldown_seconds" json:"cooldown_seconds"`
	CreatedAt       time.Time `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time `db:"updated_at" json:"updated_at"`
}
