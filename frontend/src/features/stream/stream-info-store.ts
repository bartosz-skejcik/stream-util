// file: app/stores/stream-info-store.ts
import { StreamInfo } from "@/types/services/api";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface StreamInfoState {
  streamInfo: StreamInfo | undefined;
  broadcasterId: string | undefined;
  isLoading: boolean;
  error: string | null;
}

interface StreamInfoActions {
  setStreamInfo: (streamInfo: StreamInfo) => void;
}

type StreamInfoStore = StreamInfoState & StreamInfoActions;

export const useStreamInfoStore = create<StreamInfoStore>()(
  persist(
    (set) => ({
      streamInfo: undefined,
      broadcasterId: undefined,
      isLoading: false,
      error: null,
      setStreamInfo: (streamInfo) => {
        set({ streamInfo });
      },
    }),
    {
      name: "stream-info-storage",
      storage: createJSONStorage<StreamInfoStore>(() => sessionStorage),
    },
  ),
);
