// file: app/stores/channel-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ChannelState {
  channel: string;
}

interface ChannelActions {
  setChannel: (channel: string) => void;
}

type ChannelStore = ChannelState & ChannelActions;

export const useChannelStore = create<ChannelStore>()(
  persist(
    (set) => ({
      channel: "",
      setChannel: (channel) => {
        set({ channel });
      },
    }),
    {
      name: "channel-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
