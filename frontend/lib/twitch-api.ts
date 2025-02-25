"use server";

const TWITCH_API_BASE_URL = "https://api.twitch.tv/helix";

// This should be securely stored and retrieved, not hardcoded
const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
const TWITCH_OAUTH_TOKEN = process.env.NEXT_PUBLIC_TWITCH_OAUTH_TOKEN;

if (!TWITCH_CLIENT_ID || !TWITCH_OAUTH_TOKEN) {
  console.error("Twitch API credentials are not set");
}

const headers = {
  "Client-ID": TWITCH_CLIENT_ID!,
  Authorization: `Bearer ${TWITCH_OAUTH_TOKEN}`,
  "Content-Type": "application/json",
};

export async function fetchGames(query: string): Promise<Game[]> {
  const response = await fetch(
    `${TWITCH_API_BASE_URL}/search/categories?query=${encodeURIComponent(query)}`,
    {
      headers,
    },
  );
  if (!response.ok) throw new Error("Failed to fetch games");
  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((game: any) => ({
    id: game.id,
    name: game.name,
  }));
}

export async function fetchTags(): Promise<Tag[]> {
  const response = await fetch(`${TWITCH_API_BASE_URL}/tags/streams`, {
    headers,
  });
  if (!response.ok) throw new Error("Failed to fetch tags");
  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((tag: any) => ({
    id: tag.tag_id,
    name: tag.localization_names["en-us"],
  }));
}

interface Response<T> {
  data: T;
  error: boolean;
  message: string;
}

export const searchGames = async (query: string): Promise<Response<Game[]>> => {
  try {
    const response = await fetch(
      `${TWITCH_API_BASE_URL}/games?name=${encodeURIComponent(query)}`,
      {
        headers,
      },
    );
    const data: Response<Game[]> = await response.json();
    console.log("searchGames data:", data);
    console.log("searchGames response:", response);
    console.log("searchGames query:", query);
    return data;
  } catch (error) {
    console.error("Error searching games:", error);
    return {
      data: [],
      error: true,
      message: "Failed to search games",
    };
  }
};

export interface Game {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: number;
}

export type Tag = {
  id: string;
  name: string;
};
