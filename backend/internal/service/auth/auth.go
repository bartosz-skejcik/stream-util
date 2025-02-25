package auth

import (
	"context"
	"crypto/rand"
	"encoding/gob"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"
	"twitch-client/internal/config"
	"twitch-client/internal/credentials"

	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/twitch"
)

const (
	stateCallbackKey = "oauth-state-callback"
	oauthSessionName = "oauth-session"
	oauthTokenKey    = "oauth-token"
)

type authService struct {
	credentials  *credentials.Credentials
	oauth2Config *oauth2.Config
	config       *config.Config
	cookieStore  *sessions.CookieStore
}

type AuthService interface {
	HandleLogin(w http.ResponseWriter, r *http.Request)
	HandleOAuth2Callback(w http.ResponseWriter, r *http.Request)
}

func NewAuthService(credentials *credentials.Credentials, config *config.Config) AuthService {
	cookieSecret := []byte("super-secret")

	gob.Register(&oauth2.Token{})

	cookieStore := sessions.NewCookieStore(cookieSecret)

	return &authService{
		credentials: credentials,
		oauth2Config: &oauth2.Config{
			ClientID:     config.TwitchClientID,
			ClientSecret: config.TwitchClientSecret,
			Scopes:       []string{"channel:bot", "channel:manage:broadcast", "channel:moderate", "chat:edit", "chat:read", "whispers:read", "moderator:manage:banned_users"},
			Endpoint:     twitch.Endpoint,
			RedirectURL:  "http://localhost:42069/api/auth/callback",
		},
		config:      config,
		cookieStore: cookieStore,
	}
}

func (a *authService) HandleLogin(w http.ResponseWriter, r *http.Request) {
	session, _ := a.cookieStore.Get(r, oauthSessionName)

	var tokenBytes [16]byte
	if _, err := rand.Read(tokenBytes[:]); err != nil {
		http.Error(w, "Couldn't generate a session", http.StatusInternalServerError)
		return
	}

	state := hex.EncodeToString(tokenBytes[:])

	session.AddFlash(state, stateCallbackKey)
	session.Save(r, w)

	http.Redirect(w, r, a.oauth2Config.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (a *authService) HandleOAuth2Callback(w http.ResponseWriter, r *http.Request) {
	session, err := a.cookieStore.Get(r, oauthSessionName)
	if err != nil {
		http.Error(w, "Couldn't get session", http.StatusInternalServerError)
		log.Printf("corrupted session %s -- generated new", err)
		err = nil
	}

	// ensure we flush the csrf challenge even if the request is ultimately unsuccessful
	defer func() {
		if err := session.Save(r, w); err != nil {
			log.Printf("error saving session: %s", err)
		}
	}()

	switch stateChallenge, state := session.Flashes(stateCallbackKey), r.FormValue("state"); {
	case state == "", len(stateChallenge) < 1:
		err = errors.New("missing state challenge")
	case state != stateChallenge[0]:
		err = fmt.Errorf("invalid oauth state, expected '%s', got '%s'\n", state, stateChallenge[0])
	}

	if err != nil {
		log.Printf("error validating oauth state: %s", err)
		http.Error(w, "Couldn't verify your confirmation, please try again.", http.StatusBadRequest)
		return
	}

	token, err := a.oauth2Config.Exchange(context.Background(), r.FormValue("code"))
	if err != nil {
		return
	}

	session.Values[oauthTokenKey] = token
	session.Save(r, w)

	a.credentials.Set(a.config.TwitchClientID, token.AccessToken)

	// Redirect the user back to your application's homepage or a success page
	http.Redirect(w, r, "http://localhost:3000/", http.StatusTemporaryRedirect)
}
