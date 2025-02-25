import { useEffect, useRef, useCallback } from "react";
import { useMessageStore } from "@/stores/message-store";
import {
  CONNECTION_STATE,
  useConnectionStore,
} from "@/stores/connection-store";
import { toast } from "sonner";
import { Toast } from "@/components/toast";
import { useNotificationStore } from "@/stores/notification-store";
import { useSongRequestStore } from "@/stores/song-request";

const WEBSOCKET_URL = "ws://localhost:42069/ws";
const MAX_RECONNECT_DELAY = 30000;

export function useWebSocket() {
  const socket = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const addMessage = useMessageStore((state) => state.addMessage);
  const { setConnectionState } = useConnectionStore();
  const { addNotification } = useNotificationStore();

  const connect = useCallback(() => {
    socket.current = new WebSocket(WEBSOCKET_URL);

    socket.current.onopen = () => {
      console.log("WebSocket connected");
      setConnectionState(CONNECTION_STATE.CONNECTED);
      toast.custom((t) => (
        <Toast
          t={t}
          variant="success"
          title="Websocket connected"
          description="Successfuly connected to websocket server"
        />
      ));
      reconnectAttempt.current = 0;
    };

    socket.current.onmessage = (event) => {
      // Split the message by newlines and parse each message
      const messages = event.data.split("\n");
      messages.forEach((msgStr: string) => {
        try {
          if (msgStr.trim()) {
            // Only parse non-empty strings
            const message = JSON.parse(msgStr);
            // Handle your message here
            switch (message.type) {
              case "message":
                addMessage({
                  timestamp: message.timestamp,
                  username: message.data.username,
                  color: message.data.color,
                  content: message.data.content,
                });
                break;
              case "user_join":
                addNotification(`${message.data.username} joined the stream!`);
                break;
              case "user_part":
                addNotification(`${message.data.username} left the stream!`);
                break;
              case "song_request":
                addNotification(
                  `${message.data.username} requested a song: ${message.data.song.title} - ${message.data.song.artist}`,
                );
                useSongRequestStore.getState().addSong(message.data.song);
                break;
              default:
                console.log("Unknown message type:", message.type);
                console.log("Received message:", message);
            }
          }
        } catch (error) {
          toast.error("Failed to parse incoming message");
          console.error("Failed to parse incoming message:", error);
          return;
        }
      });
    };

    socket.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionState(CONNECTION_STATE.DISCONNECTED);
      toast.custom((t) => (
        <Toast
          t={t}
          variant="warning"
          title="Websocket disconnected"
          // add a description with the attampt number
          description={`Failed to connect to websocket server. Attempt ${reconnectAttempt.current}`}
        />
      ));
      reconnect();
    };

    socket.current.onerror = () => {
      setConnectionState(CONNECTION_STATE.ERROR);
    };
  }, [addMessage]);

  const reconnect = useCallback(() => {
    const delay = Math.min(
      1000 * 2 ** reconnectAttempt.current,
      MAX_RECONNECT_DELAY,
    );
    setTimeout(() => {
      reconnectAttempt.current++;
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [connect]);

  return {
    sendMessage: (message: string) => {
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(message);
      }
    },
  };
}
