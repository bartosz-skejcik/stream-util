"use client";

import { Command, CommandDto } from "@/types/services/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toast } from "@/global/toast";
import apiService from "@/services/api";

export const useCommands = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCommands = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.fetchCommands();

        if (response.error) {
          handleError(response.message);
          return;
        }

        setCommands(response.data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        handleError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommands();
  }, []);

  async function createCommand(command: CommandDto) {
    setIsLoading(true);
    try {
      const response = await apiService.createCommand(command);

      if (response.error) {
        handleError(response.message);
        return;
      }

      setCommands((prev) => [...prev, response.data]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      handleError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteCommand(id: number) {
    setIsLoading(true);

    try {
      const response = await apiService.deleteCommand(id);

      if (response.error) {
        handleError(response.message);
        return;
      }

      setCommands((prev) => prev.filter((command) => command.id !== id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      handleError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateCommand(id: number, command: CommandDto) {
    setIsLoading(true);

    try {
      const cmd: Partial<Command> = { ...command, id };
      const response = await apiService.updateCommand(cmd);

      if (response.error) {
        handleError(response.message);
        return;
      }

      setCommands((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      handleError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleEnabled(id: number) {
    setIsLoading(true);
    if (!id || !commands) {
      handleError("Invalid command");
      setIsLoading(false);
      return;
    }

    try {
      const command = commands.find((c) => c.id === id);

      if (!command) {
        handleError("Command not found");
        setIsLoading(false);
        return;
      }

      const updatedCommand = { ...command, enabled: !command.enabled };

      await updateCommand(id, updatedCommand);

      setCommands((prev) =>
        prev.map((c) => (c.id === id ? updatedCommand : c)),
      );
    } catch (error) {
      // @ts-expect-error asdf
      handleError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    commands,
    isLoading,
    createCommand,
    deleteCommand,
    updateCommand,
    toggleEnabled,
  };
};

function handleError(error: string) {
  toast.custom((t) => (
    <Toast
      t={t}
      variant="error"
      title="Error"
      description={`Failed to fetch commands: ${error}`}
    />
  ));
}
