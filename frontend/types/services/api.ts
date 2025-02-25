import { z } from "zod";

export interface Response<T> {
  data: T;
  error: boolean;
  message: string;
}

export type ApiService = {
  fetchStreamInfo: (channel: string) => Promise<Response<StreamInfo>>;
  fetchCurrentChannel: () => Promise<Response<{ channel: string }>>;
  fetchBroadcasterId: (channel: string) => Promise<Response<{ id: number }>>;
  fetchCommands: () => Promise<Response<Command[]>>;
  updateCommand: (command: Partial<Command>) => Promise<Response<Command>>;
  deleteCommand: (id: number) => Promise<Response<null>>;
  createCommand: (command: CommandDto) => Promise<Response<Command>>;
  fetchAuthState: () => Promise<boolean>;
  saveTokens: (clientId: string, oauthToken: string) => Promise<Response<null>>;
  // poll endpoints

  // end poll endpoints
  get: <T>(
    url: string,
    config?: Record<string, unknown>,
  ) => Promise<Response<T>>;
  post: <T>(
    url: string,
    data?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => Promise<Response<T>>;
  put: <T>(
    url: string,
    data?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => Promise<Response<T>>;
  delete: <T>(
    url: string,
    config?: Record<string, unknown>,
  ) => Promise<Response<T>>;
};

export interface StreamInfo {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tag_ids: any[];
  tags: string[];
  is_mature: boolean;
}

export interface Command extends CommandDto {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface CommandDto {
  name: string;
  description: string;
  response: string;
  enabled: boolean;
  cooldown_seconds: number;
}

export const commandSchema = z.object({
  name: z.string(),
  description: z.string(),
  response: z.string(),
  enabled: z.boolean(),
  cooldown_seconds: z.number(),
});
