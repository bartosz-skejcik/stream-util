# backend/Dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o app ./cmd/server/

# Production image
FROM alpine:latest

WORKDIR /app

# Install necessary runtime dependencies
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /app/app .
COPY --from=builder /app/migrations ./migrations

# Create directories for logs and sessions if needed
RUN mkdir -p /app/log /app/sessions

# Expose the backend port (adjust as needed)
EXPOSE 42069

# Start the application
CMD ["./app"]
