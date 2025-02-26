// file: app/hooks/channel.ts
import apiService from "@/services/api";
import { useChannelStore } from "@/features/channel/channel-store";
import { useEffect } from "react";
import { useAuth } from "@/global/context/auth-context";

export const useChannel = () => {
  const { setChannel } = useChannelStore();
  const { isAuthenticated, isAuthLoaded } = useAuth();

  useEffect(() => {
    if (!isAuthLoaded || !isAuthenticated) return;

    // fetch the current channel from the server and set it in the store
    apiService.fetchCurrentChannel().then((response) => {
      if (response.error) {
        console.error("Error fetching current channel:", response.message);
        return;
      }

      if (!response.data.channel) {
        console.warn("No channel found in response");
        setChannel("");
        return;
      }

      const channel = response.data.channel;

      if (typeof channel !== "string") {
        console.error("Invalid channel type:", channel);
        return;
      }

      setChannel(channel);
    });
  }, [setChannel, isAuthenticated, isAuthLoaded]);
};
