import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

type Emote = {
  emote: string;
  count: number;
};

type Phrase = {
  phrase: string;
  count: number;
};

interface Response<T> {
  data: T;
  error: boolean;
  message: string;
}

type UserEngagement = {
  username: string;
  messages: number;
};

type TrendsResponse = {
  emotes: Emote[];
  phrases: Phrase[];
};

function Statistics() {
  const [topEmotes, setTopEmotes] = useState<Emote[]>([]);
  const [topPhrases, setTopPhrases] = useState<Phrase[]>([]);
  const [topUsers, setTopUsers] = useState<UserEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [trendsResponse, usersResponse] = await Promise.all([
          fetch("http://localhost:42069/api/trends"),
          fetch("http://localhost:42069/api/users/top"),
        ]);

        const trendsData: Response<TrendsResponse> =
          await trendsResponse.json();
        const usersData: Response<UserEngagement[]> =
          await usersResponse.json();

        setTopEmotes(trendsData.data.emotes || []);
        setTopPhrases(trendsData.data.phrases || []);

        setTopUsers(usersData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getTopEmotesString = () => {
    if (isLoading) return "Loading...";
    if (topEmotes.length === 0) return "No trends yet";
    return topEmotes
      .slice(0, 3)
      .map((e) => e.emote)
      .join(", ");
  };

  return (
    <Card className="p-3">
      <div className="flex space-x-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              Top Trends: {getTopEmotesString()}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Emote & Message Trends</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="emotes">
              <TabsList>
                <TabsTrigger value="emotes">Emotes</TabsTrigger>
                <TabsTrigger value="phrases">Phrases</TabsTrigger>
              </TabsList>
              <TabsContent value="emotes">
                {isLoading ? (
                  <p>Loading...</p>
                ) : topEmotes.length > 0 ? (
                  <ul className="space-y-2">
                    {topEmotes.map((emote, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium">{emote.emote}</span>
                        <span className="text-muted-foreground">
                          {emote.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No emote trends available</p>
                )}
              </TabsContent>
              <TabsContent value="phrases">
                {isLoading ? (
                  <p>Loading...</p>
                ) : topPhrases.length > 0 ? (
                  <ul className="space-y-2">
                    {topPhrases.map((phrase, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium">{phrase.phrase}</span>
                        <span className="text-muted-foreground">
                          {phrase.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No phrase trends available</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Most Engaged Users</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Most Engaged Users</DialogTitle>
            </DialogHeader>
            {isLoading ? (
              <p>Loading...</p>
            ) : topUsers.length > 0 ? (
              <ul className="space-y-2">
                {topUsers.map((user, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-muted-foreground">
                      {user.messages} messages
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No user engagement data available</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

export default Statistics;
