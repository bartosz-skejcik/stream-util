"use client";

import { useState, useEffect } from "react";
import { useStreamInfoStore } from "@/features/stream/stream-info-store";
import { Option } from "@components/ui/multiselect";
import { StreamInfo } from "@/types/services/api";

export function useStreamInfoSettings() {
  const streamInfo = useStreamInfoStore((state) => state.streamInfo);
  const [title, setTitle] = useState("");
  const [gameId, setGameId] = useState("");
  const [language, setLanguage] = useState("");
  const [tagIds, setTagIds] = useState<Option[]>([]);

  useEffect(() => {
    if (streamInfo) {
      setTitle(streamInfo.title || "");
      setGameId(streamInfo.game_id || "");
      setLanguage(streamInfo.language || "");
      setTagIds(streamInfo.tag_ids || []);
    }
  }, [streamInfo]);

  const updateSettings = (newSettings: Partial<StreamInfo>) => {
    setTitle(newSettings.title || title);
    setGameId(newSettings.game_id || gameId);
    setLanguage(newSettings.language || language);
    setTagIds(newSettings.tag_ids || tagIds);
  };

  return {
    settings: { title, gameId, language, tagIds },
    updateSettings,
    setTitle,
    setGameId,
    setLanguage,
    setTagIds,
  };
}
