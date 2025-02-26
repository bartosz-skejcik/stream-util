import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Switch } from "@components/ui/switch";
import { Textarea } from "@components/ui/textarea";
import { CommandDto, commandSchema } from "@/types/services/api";
import { toast } from "sonner";
import { Toast } from "@/global/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";

interface AddCommandModalProps {
  onSave: (cmd: CommandDto) => Promise<void>;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCommandModal({
  onSave,
  onCancel,
  open,
  onOpenChange,
}: AddCommandModalProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      response: formData.get("response") as string,
      enabled: formData.get("enabled") === "on",
      cooldown_seconds: Number(formData.get("cooldown")),
    };

    if (!commandSchema.safeParse(data)) {
      toast.custom((t) => (
        <Toast t={t} variant="error" title="Error" description="Invalid data" />
      ));
      return;
    }

    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="sr-only">
        <div />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add a New Command
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Command name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Command description"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="response">Response</Label>
            <Textarea
              id="response"
              name="response"
              placeholder="Command response"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-start gap-2">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch id="enabled" name="enabled" />
          </div>
          <div>
            <Label htmlFor="cooldown">Cooldown (seconds)</Label>
            <Input
              id="cooldown"
              type="number"
              name="cooldown"
              placeholder="Cooldown in seconds"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
