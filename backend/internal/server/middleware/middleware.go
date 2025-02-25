package middleware

import (
	"compress/gzip"
	"context"
	"io"
	"log"
	"net/http"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Middleware func(http.HandlerFunc) http.HandlerFunc

// Chain applies middlewares in the order they are passed
func Chain(handler http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
	for _, middleware := range middlewares {
		handler = middleware(handler)
	}
	return handler
}

// Logger logs request information
func Logger() Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Skip wrapping for WebSocket connections
			if strings.ToLower(r.Header.Get("Upgrade")) == "websocket" {
				next(w, r)
				log.Printf(
					"%s %s %s WebSocket %v",
					r.Method,
					r.RequestURI,
					r.RemoteAddr,
					time.Since(start),
				)
				return
			}

			// Create a custom response writer to capture the status code
			rw := &responseWriter{
				ResponseWriter: w,
				status:         http.StatusOK,
			}

			next(rw, r)

			log.Printf(
				"%s %s %s %d %v",
				r.Method,
				r.RequestURI,
				r.RemoteAddr,
				rw.status,
				time.Since(start),
			)
		}
	}
}

func WebSocketCORS() Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*") // Or your specific origin
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Sec-WebSocket-Key, Sec-WebSocket-Protocol, Sec-WebSocket-Version, Sec-WebSocket-Extensions")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}
}

// CORS handles Cross-Origin Resource Sharing
func CORS(allowedOrigins []string) Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			}

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}
}

// Recover handles panics in the application
func Recover() Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Printf("panic: %v\n%s", err, debug.Stack())
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
			}()
			next(w, r)
		}
	}
}

// Auth middleware for protecting routes
func Auth(validateToken func(string) bool) Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get("Authorization")
			if token == "" {
				http.Error(w, "Unauthorized: No token provided", http.StatusUnauthorized)
				return
			}

			// Remove "Bearer " prefix if present
			token = strings.TrimPrefix(token, "Bearer ")

			if !validateToken(token) {
				http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
				return
			}

			next(w, r)
		}
	}
}

// RateLimit implements a simple rate limiting middleware
func RateLimit(requests int, duration time.Duration) Middleware {
	type client struct {
		count    int
		lastSeen time.Time
	}

	clients := make(map[string]*client)
	var mu sync.RWMutex

	// Start cleanup routine
	go func() {
		for {
			time.Sleep(duration)
			mu.Lock()
			for ip, c := range clients {
				if time.Since(c.lastSeen) > duration {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			mu.Lock()
			if _, exists := clients[ip]; !exists {
				clients[ip] = &client{}
			}

			c := clients[ip]
			if time.Since(c.lastSeen) > duration {
				c.count = 0
			}

			c.count++
			c.lastSeen = time.Now()

			if c.count > requests {
				mu.Unlock()
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}
			mu.Unlock()

			next(w, r)
		}
	}
}

// Custom response writer to capture status code
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// Compress middleware for gzip compression
func Compress() Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
				next(w, r)
				return
			}

			gz := gzip.NewWriter(w)
			defer gz.Close()

			w.Header().Set("Content-Encoding", "gzip")
			gzw := &gzipResponseWriter{
				ResponseWriter: w,
				Writer:         gz,
			}

			next(gzw, r)
		}
	}
}

type gzipResponseWriter struct {
	http.ResponseWriter
	io.Writer
}

func (gzw *gzipResponseWriter) Write(data []byte) (int, error) {
	return gzw.Writer.Write(data)
}

// RequestID middleware adds a unique ID to each request
func RequestID() Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			requestID := uuid.New().String()
			w.Header().Set("X-Request-ID", requestID)
			ctx := context.WithValue(r.Context(), "request_id", requestID)
			next(w, r.WithContext(ctx))
		}
	}
}

// Timeout middleware adds a timeout to the request context
func Timeout(timeout time.Duration) Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), timeout)
			defer cancel()

			done := make(chan bool)
			go func() {
				next(w, r.WithContext(ctx))
				done <- true
			}()

			select {
			case <-done:
				return
			case <-ctx.Done():
				http.Error(w, "Request Timeout", http.StatusGatewayTimeout)
			}
		}
	}
}
