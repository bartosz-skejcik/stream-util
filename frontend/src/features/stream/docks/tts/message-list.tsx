import React, { useEffect, useRef, useMemo } from "react";
import { useMessageStore } from "@/features/message/message-store";
import { MessageItem } from "@/features/message/message-item";
import { Card, CardTitle } from "@components/ui/card";
import {
  CONNECTION_STATE,
  useConnectionStore,
} from "@/global/stores/connection-store";
import { useChannelStore } from "@/features/channel/channel-store";
//import { Message } from "@/types/websocket";

const ConnectionStatus = ({ status }: { status: CONNECTION_STATE }) => {
  switch (status) {
    case CONNECTION_STATE.CONNECTED:
      return <span className="font-normal text-green-500">Connected</span>;
    case CONNECTION_STATE.DISCONNECTED:
      return <span className="font-normal text-red-500">Disconnected</span>;
    case CONNECTION_STATE.ERROR:
      return <span className="font-normal text-red-500">Error</span>;
    default:
      return <span className="font-normal text-yellow-500">Unknown</span>;
  }
};

export const MessageList: React.FC = () => {
  const playedMessages = useMessageStore((state) => state.playedMessages);
  const unplayedMessages = useMessageStore((state) => state.unplayedMessages);
  const listRef = useRef<HTMLDivElement>(null);
  const connectionStatus = useConnectionStore((state) => state.state);
  const { channel } = useChannelStore();

  const messages = useMemo(
    () => [...playedMessages, ...unplayedMessages],
    [playedMessages, unplayedMessages],
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  //const dummyMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
  //  id: i,
  //  timestamp: Date.now().toString(),
  //  content: `This is a test message ${i}`,
  //  username: `user-${i}`,
  //  color: "#ff0000",
  //}));

  return (
    <Card className="relative flex flex-col h-full w-full overflow-y-auto">
      <CardTitle className="mb-3 text-xl font-semibold top-0 pt-3 px-3 pb-2 bg-background z-40 inset-x-3 sticky">
        Connection status: <ConnectionStatus status={connectionStatus} /> (
        {channel && typeof channel === "string"
          ? channel
          : "No channel selected"}
        )
      </CardTitle>
      <div
        ref={listRef}
        className="flex flex-col items-start w-full justify-start overflow-y-auto gap-2 -mt-2 px-3"
      >
        {messages.map((message, index) => (
          <MessageItem
            key={`${message.timestamp}-${index}`}
            message={message}
          />
        ))}
      </div>
    </Card>
  );
};
