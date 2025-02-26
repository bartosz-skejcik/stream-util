import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "sonner";
import { Toast } from "@/global/toast";
import { useChannelStore } from "@/features/channel/channel-store";
import { useAuth } from "@/global/context/auth-context";

export const ChannelSelector: React.FC = () => {
  const { channel, setChannel } = useChannelStore();
  const { isAuthenticated, isAuthLoaded } = useAuth();

  if (!isAuthLoaded) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const channel = formData.get("current-channel") as string;
    try {
      const response = await fetch(
        "http://localhost:42069/api/channel/change",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `channel=${encodeURIComponent(channel)}`,
        },
      );

      if (response.ok) {
        const data = await response.json();
        setChannel(data);
        toast.custom((t) => (
          <Toast
            t={t}
            variant="success"
            title="Channel set"
            description={`The channel has been set to: ${channel}`}
          />
        ));
        window.location.reload();
      } else {
        toast.custom((t) => (
          <Toast
            t={t}
            variant="error"
            title="Failed to set channel"
            description="Please make sure the channel name is correct and try again."
          />
        ));
      }
    } catch (error) {
      console.error("Error setting channel:", error);
      toast.custom((t) => (
        <Toast
          t={t}
          variant="error"
          title="Error setting channel"
          description="An error occurred while setting the channel."
        />
      ));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-start w-full gap-2 mb-4"
    >
      <Label htmlFor="current-channel">Twitch Channel:</Label>
      <div className="w-full flex gap-2">
        <Input
          id="current-channel"
          name="current-channel"
          type="text"
          defaultValue={channel}
          placeholder="Enter Twitch channel name"
          className="flex-grow"
          disabled={!isAuthenticated}
        />
        <Button variant="secondary" type="submit" disabled={!isAuthenticated}>
          Save
        </Button>
      </div>
    </form>
  );
};
