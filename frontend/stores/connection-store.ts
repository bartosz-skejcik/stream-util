import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export enum CONNECTION_STATE {
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECTED = 2,
  DISCONNECTING = 3,
  ERROR = 4,
}

interface ConnectionState {
  state: CONNECTION_STATE;
}

interface ConnectionActions {
  setConnectionState: (state: CONNECTION_STATE, error?: string) => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      state: CONNECTION_STATE.DISCONNECTED,

      setConnectionState: (state) => {
        set({ state });
      },
    }),
    {
      name: "connection-storage",
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
