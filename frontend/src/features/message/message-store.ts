import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Message } from "@/types/websocket";

interface MessageState {
  unplayedMessages: Message[];
  currentMessage: Message | null;
  playedMessages: Message[];
  ttsLanguage: string;
  ttsVoice: string;
  isPaused: boolean;
  playbackPosition: number;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
  includeUsername: boolean;
}

interface MessageActions {
  addMessage: (message: Message) => void;
  removeMessage: (message: Message) => void;
  skipCurrentMessage: () => void;
  setCurrentMessage: (message: Message | null) => void;
  markMessageAsPlayed: (message: Message) => void;
  moveToNextMessage: () => void;
  setTTSLanguage: (language: string) => void;
  setTTSVoice: (voice: string) => void;
  setPaused: (isPaused: boolean) => void;
  setPlaybackPosition: (position: number) => void;
  setTTSRate: (rate: number) => void;
  setTTSPitch: (pitch: number) => void;
  setTTSVolume: (volume: number) => void;
  replayMessage: (message: Message) => void;
  clearMessages: () => void;
  replayCurrentMessage: () => void;
  setIncludeUsername: (include: boolean) => void;
}

type MessageStore = MessageState & MessageActions;

export const useMessageStore = create<MessageStore>()(
  persist(
    (set) => ({
      unplayedMessages: [],
      currentMessage: null,
      playedMessages: [],
      ttsLanguage: "en-US",
      ttsVoice: "",
      isPaused: false,
      playbackPosition: 0,
      ttsRate: 1,
      ttsPitch: 1,
      ttsVolume: 1,
      includeUsername: true,

      addMessage: (message: Message) =>
        set((state) => {
          // Pre-calculate message arrays
          const unplayedMessages = [...state.unplayedMessages, message];
          const playedMessages = state.playedMessages;
          const totalMessages = playedMessages.length + unplayedMessages.length;

          // If under limit, just add the message without sorting
          if (totalMessages <= 50) {
            return {
              unplayedMessages,
              playedMessages,
              currentMessage: state.currentMessage ?? unplayedMessages[0],
            };
          }

          // Handle message limit enforcement
          if (playedMessages.length > 0) {
            // Remove oldest played message
            const oldestTimestamp = Math.min(
              ...playedMessages.map((msg) => new Date(msg.timestamp).getTime()),
            );
            const oldestIndex = playedMessages.findIndex(
              (msg) => new Date(msg.timestamp).getTime() === oldestTimestamp,
            );
            playedMessages.splice(oldestIndex, 1);
          } else {
            // For unplayed messages, first try to remove non-current messages
            const currentMsg = state.currentMessage;
            const oldestNonCurrentIndex = unplayedMessages.findIndex(
              (msg) => msg !== currentMsg,
            );

            if (oldestNonCurrentIndex !== -1) {
              unplayedMessages.splice(oldestNonCurrentIndex, 1);
            } else {
              unplayedMessages.shift();
            }
          }

          // Check if current message still exists in either array
          const currentExists =
            playedMessages.includes(state.currentMessage as Message) ||
            unplayedMessages.includes(state.currentMessage as Message);

          return {
            unplayedMessages,
            playedMessages,
            currentMessage: currentExists
              ? state.currentMessage
              : (unplayedMessages[0] ?? null),
          };
        }),

      removeMessage: (message: Message) =>
        set((state) => {
          const playedMessages = state.playedMessages.filter(
            (m) => m !== message,
          );
          const unplayedMessages = state.unplayedMessages.filter(
            (m) => m !== message,
          );
          const currentMessage =
            state.currentMessage === message ? null : state.currentMessage;

          return {
            playedMessages,
            unplayedMessages,
            currentMessage,
          };
        }),

      skipCurrentMessage: () =>
        set((state) => {
          if (state.currentMessage) {
            const newPlayedMessages = [
              ...state.playedMessages,
              state.currentMessage,
            ];
            const newUnplayedMessages = state.unplayedMessages.filter(
              (m) => m !== state.currentMessage,
            );
            const nextMessage = newUnplayedMessages[0] || null;

            return {
              playedMessages: newPlayedMessages,
              unplayedMessages: newUnplayedMessages,
              currentMessage: nextMessage,
            };
          }
          return state;
        }),

      setCurrentMessage: (message) => set({ currentMessage: message }),

      markMessageAsPlayed: (message) =>
        set((state) => ({
          unplayedMessages: state.unplayedMessages.filter((m) => m !== message),
          playedMessages: [...state.playedMessages, message],
          currentMessage: null,
        })),

      moveToNextMessage: () =>
        set((state) => {
          if (state.currentMessage) {
            const newPlayedMessages = [
              ...state.playedMessages,
              state.currentMessage,
            ];
            const newUnplayedMessages = state.unplayedMessages.filter(
              (m) => m !== state.currentMessage,
            );
            const nextMessage = newUnplayedMessages[0] || null;

            return {
              playedMessages: newPlayedMessages,
              unplayedMessages: newUnplayedMessages,
              currentMessage: nextMessage,
            };
          }
          return state;
        }),

      setTTSLanguage: (language) => set({ ttsLanguage: language }),
      setTTSVoice: (voice) => set({ ttsVoice: voice }),
      setPaused: (isPaused) => set({ isPaused }),
      setPlaybackPosition: (position) => set({ playbackPosition: position }),
      setTTSRate: (rate) => set({ ttsRate: rate }),
      setTTSPitch: (pitch) => set({ ttsPitch: pitch }),
      setTTSVolume: (volume) => set({ ttsVolume: volume }),
      replayMessage: (message) =>
        set((state) => {
          // Move the message from playedMessages to unplayedMessages
          const newPlayedMessages = state.playedMessages.filter(
            (m) => m !== message,
          );
          const newUnplayedMessages = [message, ...state.unplayedMessages].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );

          return {
            playedMessages: newPlayedMessages,
            unplayedMessages: newUnplayedMessages,
            currentMessage: state.currentMessage || message,
          };
        }),

      clearMessages() {
        set({
          unplayedMessages: [],
          currentMessage: null,
          playedMessages: [],
        });
      },

      replayCurrentMessage: () =>
        set((state) => {
          if (state.currentMessage) {
            // Move the current message to the front of unplayed messages
            const newUnplayedMessages = [
              state.currentMessage,
              ...state.unplayedMessages.filter(
                (m) => m !== state.currentMessage,
              ),
            ];

            return {
              unplayedMessages: newUnplayedMessages,
              currentMessage: state.currentMessage,
            };
          }
          return state;
        }),

      setIncludeUsername: (include) => set({ includeUsername: include }),
    }),
    {
      name: "message-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
