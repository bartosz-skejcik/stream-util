import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Command, CommandDto, commandSchema } from "@/types/services/api";
import { useCommands } from "@/hooks/use-commands";
import { toast } from "sonner";
import { Toast } from "../toast";
import { LoaderCircleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "../ui/switch";

interface EditCommandModalProps {
  command: Command;
  onCancel: () => void;
  onSave: (id: number, cmd: CommandDto) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCommandModal({
  command,
  onCancel,
  onSave,
  open,
  onOpenChange,
}: EditCommandModalProps) {
  const { isLoading } = useCommands();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!command.id) {
      toast.custom((t) => (
        <Toast
          t={t}
          variant="error"
          title="Error"
          description="Invalid command"
        />
      ));
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const data: CommandDto = {
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

    await onSave(command.id, data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="sr-only">
        <div />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Command</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1"
              name="name"
              defaultValue={command.name}
              placeholder="Name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              className="mt-1"
              name="description"
              defaultValue={command.description}
              placeholder="Description"
            />
          </div>
          <div>
            <Label htmlFor="response">Response</Label>
            <Input
              id="response"
              className="mt-1"
              name="response"
              defaultValue={command.response}
              placeholder="Response"
            />
          </div>
          <div className="flex items-center justify-start gap-2">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch
              id="enabled"
              name="enabled"
              defaultChecked={command.enabled}
            />
          </div>
          <div>
            <Label htmlFor="cooldown">Cooldown (seconds)</Label>
            <Input
              id="cooldown"
              className="mt-1"
              type="number"
              name="cooldown"
              defaultValue={command.cooldown_seconds}
              placeholder="Cooldown (seconds)"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoaderCircleIcon className="animate-spin" />}
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
