"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./use-debounce";
import { searchGames, type Game } from "@/lib/twitch-api";
import { useStreamInfoStore } from "@/features/stream/stream-info-store";
import apiService from "@/services/api";

export function useTwitchApi() {
  const [games, setGames] = useState<Game[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [gameSearch, setGameSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStreamInfo = useStreamInfoStore((state) => state.setStreamInfo);
  const userName = useStreamInfoStore((state) => state.streamInfo?.user_name);

  const debouncedGameSearch = useDebounce(gameSearch, 300);

  const loadStreamInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userName) {
        setError("Please enter a twitch channel.");
        return;
      }

      const response = await apiService.fetchStreamInfo(userName);

      if (!response.error) {
        setStreamInfo(response.data);
        if (response.data.game_id && response.data.game_name) {
          setGames([
            {
              id: response.data.game_id,
              name: response.data.game_name,
              box_art_url: "",
              igdb_id: 0,
            },
          ]);
        }
        if (response.data.tags) {
          setTags(
            response.data.tags.map((tag, index) => ({
              id: `tag-${index}`,
              name: tag,
            })),
          );
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load stream info. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [setStreamInfo, userName]);

  useEffect(() => {
    loadStreamInfo();
  }, [loadStreamInfo]);

  useEffect(() => {
    const searchForGames = async () => {
      if (debouncedGameSearch) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await searchGames(debouncedGameSearch);
          if (!response.error) {
            setGames(response.data);
          } else {
            setError(response.message);
          }
        } catch (err) {
          setError("Failed to search games. Please try again.");
          console.error(err);
        }
        setIsLoading(false);
      }
    };

    searchForGames();
  }, [debouncedGameSearch]);

  return {
    games,
    tags,
    gameSearch,
    setGameSearch,
    isLoading,
    error,
    refreshStreamInfo: loadStreamInfo,
  };
}
