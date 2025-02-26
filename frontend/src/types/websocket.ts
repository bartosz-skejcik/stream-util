export interface WebSocketService {
  connect(): Promise<void>;
  disconnect(): void;
  onMessage(callback: (message: Message) => void): void;
  onError(callback: (error: Error) => void): void;
  onReconnect(callback: (attempt: number) => void): void;
}

export interface Message {
  timestamp: string;
  username: string;
  color: string;
  content: string;
}
