import React, { useEffect, useMemo, useState } from "react";
import { useMessageStore } from "@/stores/message-store";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Slider from "@/components/slider";
import { cn } from "@/lib/utils";
import {
  PauseIcon,
  PlayIcon,
  SkipForwardIcon,
  RepeatIcon,
  Link2,
  Trash2Icon,
} from "lucide-react";
import { ChannelSelector } from "@/components/channel-selector";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { useChannelStore } from "@/stores/channel-store";
import SelectWithSearch from "@/components/select-with-search";

type Props = {
  className?: string;
};

export const ControlSidebar = ({ className }: Props) => {
  const {
    ttsLanguage,
    ttsVoice,
    isPaused,
    ttsRate,
    ttsPitch,
    ttsVolume,
    includeUsername,
    setTTSLanguage,
    setTTSVoice,
    setPaused,
    setTTSRate,
    setTTSPitch,
    setTTSVolume,
    clearMessages,
    skipCurrentMessage,
    replayCurrentMessage,
    setIncludeUsername,
  } = useMessageStore();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { channel } = useChannelStore();

  useEffect(() => {
    const loadVoices = async () => {
      const synth = window.speechSynthesis;
      const availableVoices = await new Promise<SpeechSynthesisVoice[]>(
        (resolve) => {
          const voices = synth.getVoices();
          if (voices.length > 0) {
            resolve(voices);
          } else {
            synth.onvoiceschanged = () => {
              resolve(synth.getVoices());
            };
          }
        },
      );
      setVoices(availableVoices);
      console.log(availableVoices);
    };

    loadVoices();
  }, []);

  const handleLanguageChange = (v: string) => {
    setTTSLanguage(v);
    const voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang === v);
    setTTSVoice(voices[0].name);
  };

  const handleVoiceChange = (v: string) => {
    setTTSVoice(v);
  };

  const handlePauseToggle = () => {
    setPaused(!isPaused);
  };

  const handleSkipMessage = () => {
    skipCurrentMessage();
  };

  const handleReplayMessage = () => {
    replayCurrentMessage();
  };

  const handleRateChange = (v: number[]) => {
    setTTSRate(v[0]);
  };

  const handlePitchChange = (v: number[]) => {
    setTTSPitch(v[0]);
  };

  const handleVolumeChange = (v: number[]) => {
    setTTSVolume(v[0]);
  };

  const languagesArray = useMemo(() => {
    // transform to array of objects with label and value
    return Array.from(new Set(voices.map((voice) => voice.lang))).map(
      (lang) => ({
        label: lang,
        value: lang,
      }),
    );
  }, [voices]);

  return (
    <Card className={cn("p-4", className)}>
      <CardTitle className="flex justify-between w-ful mb-2 items-center">
        <h1 className="text-xl font-semibold">TTS Controls</h1>
      </CardTitle>
      <div className="mb-4">
        <p>
          Connected Channel:
          {channel && typeof channel === "string" ? (
            <Link
              className="text-purple-500 ml-1 underline font-medium"
              href={`https://twitch.tv/${channel}`}
              target="_blank"
            >
              {channel} <Link2 className="w-4 h-4 inline ml-1" />
            </Link>
          ) : (
            "Not set"
          )}
        </p>
      </div>
      <div className="mb-4">
        <Label htmlFor="language" className="block mb-2">
          Language:
        </Label>
        {/**<Select value={ttsLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {Array.from(new Set(voices.map((voice) => voice.lang))).map(
              (lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>**/}
        <SelectWithSearch
          id="language"
          value={ttsLanguage}
          onValueChangeAction={handleLanguageChange}
          options={languagesArray}
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="voice" className="block mb-2">
          Voice:
        </Label>
        <Select value={ttsVoice} onValueChange={handleVoiceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {voices
              .filter((voice) => voice.lang === ttsLanguage)
              .map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <ChannelSelector />
      <div className="mb-4 flex gap-2">
        <Button
          onClick={handlePauseToggle}
          variant={isPaused ? "success" : "danger"}
          className="flex-1 text-sm"
        >
          {isPaused ? (
            <PlayIcon className="w-6 h-6" />
          ) : (
            <PauseIcon className="w-6 h-6" />
          )}
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          onClick={handleSkipMessage}
          variant="outline"
          className="flex-none text-sm"
        >
          <SkipForwardIcon className="w-6 h-6" />
        </Button>
        <Button
          onClick={handleReplayMessage}
          variant="outline"
          className="flex-none text-sm"
        >
          <RepeatIcon className="w-6 h-6" />
        </Button>
        <Button onClick={clearMessages} variant="outline">
          <Trash2Icon className="w-6 h-6" />
          Clear
        </Button>
      </div>
      <div className="mb-4">
        <Slider
          defaultValue={[ttsRate]}
          label="Rate"
          max={2}
          step={0.1}
          min={0.5}
          className={"w-full"}
          onValueChange={handleRateChange}
        />
      </div>
      <div className="mb-4">
        <Slider
          defaultValue={[ttsPitch]}
          label="Pitch"
          max={1}
          step={0.1}
          min={0.2}
          className={cn("w-full")}
          onValueChange={handlePitchChange}
        />
      </div>
      <div className="mb-6">
        <Slider
          defaultValue={[ttsVolume]}
          variant="volume"
          label="Volume"
          max={1}
          step={0.1}
          min={0.2}
          className={cn("w-full")}
          onValueChange={handleVolumeChange}
        />
      </div>
      <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-3 mb-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
        <Switch
          id="include-username"
          className="order-1 h-6 w-10 after:absolute after:inset-0 [&_span]:size-5 [&_span]:data-[state=checked]:translate-x-4 rtl:[&_span]:data-[state=checked]:-translate-x-2"
          aria-describedby={`include-username-description`}
          checked={includeUsername}
          onCheckedChange={setIncludeUsername}
        />
        <div className="grid grow gap-2">
          <Label htmlFor="include-username">
            Read username{" "}
            <span className="text-xs font-normal leading-[inherit] text-muted-foreground">
              (experimental)
            </span>
          </Label>
          <p
            id={`include-username-description`}
            className="text-xs text-muted-foreground"
          >
            Include the username in the TTS message.
          </p>
        </div>
      </div>
    </Card>
  );
};
