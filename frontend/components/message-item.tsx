import React from "react";
import { useMessageStore } from "@/stores/message-store";
import { Message } from "@/types/websocket";
import { Button } from "./ui/button";
import { SkipForwardIcon, Radio, RotateCcwIcon, XIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const {
    currentMessage,
    playedMessages,
    moveToNextMessage,
    setCurrentMessage,
    replayMessage,
    removeMessage,
  } = useMessageStore();

  const isPlaying = currentMessage === message;
  const wasPlayed = playedMessages.includes(message);

  const handleSkip = () => {
    if (isPlaying) {
      moveToNextMessage();
    }
  };

  const handleForwardTo = () => {
    if (!wasPlayed && !isPlaying) {
      setCurrentMessage(message);
    }
  };

  const handleReplay = () => {
    replayMessage(message);
  };

  const getStatusStyles = () => {
    if (isPlaying)
      return "bg-blue-500/5 border-blue-300 shadow-lg shadow-blue-600/40";
    if (wasPlayed) return "opacity-60";
    return "";
  };

  const handleDelete = () => {
    removeMessage(message);
  };

  return (
    <Card
      className={`mb-2 w-full transition-all duration-200 ${getStatusStyles()}`}
    >
      <CardContent className="p-2 flex items-center">
        <div className="flex-grow">
          <p
            className={cn("font-medium")}
            style={{
              color: isPlaying
                ? "#2563eb"
                : wasPlayed
                  ? "#6b7280"
                  : message.color,
            }}
          >
            @{message.username}
          </p>
          <p className="text-md text-muted-foreground">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {isPlaying && (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
              <Radio className="h-4 w-4 text-white" />
            </div>
          )}

          {!wasPlayed && !isPlaying && (
            <Button size="icon" variant="ghost" onClick={handleForwardTo}>
              <SkipForwardIcon className="h-4 w-4" />
            </Button>
          )}

          {isPlaying ? (
            <Button size="icon" variant="ghost" onClick={handleSkip}>
              <SkipForwardIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" onClick={handleDelete}>
              <XIcon className="h-4 w-4" />
            </Button>
          )}

          {wasPlayed && (
            <Button size="icon" variant="ghost" onClick={handleReplay}>
              <RotateCcwIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
