"use client";

import { useStreamInfoSettings } from "@/features/stream/use-stream-info-settings";
import { useTwitchApi } from "@/global/hooks/use-twitch-api";
import { useEffect } from "react";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import MultiSelect from "@/features/ui/multi-select";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { useChannelStore } from "@/features/channel/channel-store";

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "Polish", value: "pl" },
  // Add more languages as needed
];

function Stream() {
  const { channel } = useChannelStore();
  const {
    settings,
    //updateSettings,
    setTitle,
    setGameId,
    setLanguage,
    setTagIds,
  } = useStreamInfoSettings();
  const { games, tags, gameSearch, setGameSearch, isLoading, error } =
    useTwitchApi();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log(settings);
  };

  useEffect(() => {
    if (error) {
      //toast.custom((t) => <Toast variant="error" t={t} title={error} />);
    }
  }, [error]);

  if (!channel) {
    return null;
  }

  return (
    <>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Stream Title</Label>
          <Input
            id="title"
            value={settings.title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="game">Game</Label>
          <Select value={settings.gameId} onValueChange={setGameId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a game" />
            </SelectTrigger>
            <SelectContent>
              <Input
                placeholder="Search for a game"
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                className="mb-2"
              />
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : games.length > 0 ? (
                games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-results" disabled>
                  No results found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={settings.language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <MultiSelect
            options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
            selected={settings.tagIds}
            onChange={setTagIds}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          Save Changes
        </Button>
      </form>
    </>
  );
}

export default Stream;
