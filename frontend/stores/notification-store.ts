import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface NotificationState {
  notifications: {
    content: string;
    read: boolean;
  }[];
}

interface NotificationActions {
  addNotification: (content: string) => void;
  markNotificationAsRead: (content: string) => void;
  removeNotification: (content: string) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (content) => {
        set((state) => {
          const notifications = [
            ...state.notifications,
            {
              content,
              read: false,
            },
          ];
          return { notifications };
        });
      },

      markNotificationAsRead: (notification) => {
        set((state) => {
          const notifications = state.notifications.map((n) => {
            if (n.content === notification) {
              n.read = true;
            }
            return n;
          });
          return { notifications };
        });
      },

      removeNotification: (notification) => {
        set((state) => {
          const notifications = state.notifications.filter(
            (n) => n.content !== notification,
          );
          return { notifications };
        });
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
