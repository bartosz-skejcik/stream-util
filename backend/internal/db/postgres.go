package db

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"twitch-client/internal/config"
	"twitch-client/internal/db/models"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Database struct {
	*sqlx.DB
}

func NewPostgresDB(cfg *config.Config) (*Database, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	db, err := sqlx.Connect("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error connecting to database: %v", err)
	}

	return &Database{db}, nil
}

func (db *Database) ApplyMigrations() error {
	// Create schema_migrations table to track applied migrations
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Read all migration files from the migrations directory
	files, err := filepath.Glob("migrations/*.up.sql")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Sort files lexicographically to ensure correct order
	sort.Strings(files)

	versionRegex := regexp.MustCompile(`^(\d+)`)

	for _, file := range files {
		filename := filepath.Base(file)
		matches := versionRegex.FindStringSubmatch(filename)
		if matches == nil {
			return fmt.Errorf("invalid migration filename: %s, must start with a numeric version", filename)
		}
		version := matches[1]

		// Check if migration is already applied
		var exists bool
		err := db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)",
			version,
		).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check migration version %s: %w", version, err)
		}
		if exists {
			continue
		}

		// Read migration file content
		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		// Execute migration within a transaction
		tx, err := db.Beginx()
		if err != nil {
			return fmt.Errorf("failed to begin transaction for version %s: %w", version, err)
		}

		// Apply migration
		if _, err = tx.Exec(string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration version %s: %w", version, err)
		}

		// Record migration version
		if _, err = tx.Exec(
			"INSERT INTO schema_migrations (version) VALUES ($1)",
			version,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration version %s: %w", version, err)
		}

		// Commit transaction
		if err = tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit transaction for version %s: %w", version, err)
		}
	}

	return nil
}

// Command methods
func (db *Database) GetAllCommands() ([]models.Command, error) {
	var commands []models.Command
	err := db.Select(&commands, "SELECT * FROM commands")
	if err != nil {
		return nil, err
	}
	return commands, nil
}

func (db *Database) GetCommandByName(name string) (models.Command, error) {
	var cmd models.Command
	err := db.Get(&cmd, "SELECT * FROM commands WHERE name = $1", name)
	if err != nil {
		return models.Command{}, err
	}
	return cmd, nil
}

func (db *Database) CreateCommand(cmd *models.Command) error {
	query := `
        INSERT INTO commands (name, description, response, enabled, cooldown_seconds)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at, updated_at`

	return db.QueryRow(
		query,
		cmd.Name,
		cmd.Description,
		cmd.Response,
		cmd.Enabled,
		cmd.CooldownSeconds,
	).Scan(&cmd.ID, &cmd.CreatedAt, &cmd.UpdatedAt)
}

func (db *Database) UpdateCommand(cmd *models.Command) (*models.Command, error) {
	query := `
        UPDATE commands
        SET name = $1, description = $2, response = $3, enabled = $4, cooldown_seconds = $5
        WHERE id = $6
        RETURNING id, name, description, response, enabled, cooldown_seconds, created_at, updated_at`

	err := db.QueryRow(
		query,
		cmd.Name,
		cmd.Description,
		cmd.Response,
		cmd.Enabled,
		cmd.CooldownSeconds,
		cmd.ID,
	).Scan(
		&cmd.ID,
		&cmd.Name,
		&cmd.Description,
		&cmd.Response,
		&cmd.Enabled,
		&cmd.CooldownSeconds,
		&cmd.CreatedAt,
		&cmd.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return cmd, nil
}

func (db *Database) DeleteCommand(id int) error {
	_, err := db.Exec("DELETE FROM commands WHERE id = $1", id)
	return err
}
