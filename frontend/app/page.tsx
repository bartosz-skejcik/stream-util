// file: app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { TTSManager } from "@/components/tts-manager";
import { Toaster } from "@/components/ui/sonner";
import TokenModal from "@/components/modals/token-modal";
import { useChannel } from "@/hooks/use-channel";
import { useAuth } from "@/context/auth-context";
import Sidebar from "@/components/docks/sidebar";
import Tabs from "@/components/tabs";
import { TabsProvider } from "@/context/tabs-context";
import { HeadphonesIcon, HomeIcon, PodcastIcon, UsersIcon } from "lucide-react";
import TtsTab from "@/components/tabs/tts-tab";
import EngagementTab from "@/components/tabs/engagement-tab";
import GeneralTab from "@/components/tabs/general-tab";

export default function Home() {
  const { isAuthenticated, isAuthLoaded } = useAuth();
  const [open, setOpen] = useState<boolean>(false);

  const tabs = [
    {
      id: "general",
      name: "General",
      icon: <HomeIcon className="w-6 h-6" />,
      component: <GeneralTab />,
    },
    {
      id: "tts",
      name: "TTS",
      icon: <HeadphonesIcon className="w-6 h-6" />,
      component: <TtsTab />,
    },
    {
      id: "obs",
      name: "OBS",
      icon: <PodcastIcon className="w-6 h-6" />,
      component: <div>obs</div>,
    },
    {
      id: "engagement",
      name: "Engagement",
      icon: <UsersIcon className="w-6 h-6" />,
      component: <EngagementTab />,
    },
  ];

  useChannel();
  useWebSocket(); // Initialize WebSocket connection

  useEffect(() => {
    // Only set modal state once auth has been determined
    if (isAuthLoaded) {
      setOpen(!isAuthenticated);
    }
  }, [isAuthenticated, isAuthLoaded]);

  // Optionally render a loading state while auth is being determined
  if (!isAuthLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <TabsProvider tabs={tabs}>
      <main className="mx-auto max-w-8xl grid grid-cols-20 w-full h-dvh bg-background text-foreground gap-4 grid-rows-1 p-5">
        {/* Modals go here */}
        <Sidebar />
        <Tabs />
        <TTSManager />
        <Toaster position="top-center" />
        <TokenModal open={open} setOpenAction={setOpen} />
      </main>
    </TabsProvider>
  );
}
