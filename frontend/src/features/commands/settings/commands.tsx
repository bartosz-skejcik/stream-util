import { useMemo, useState } from "react";
import { useCommands } from "@/features/commands/use-commands";
import { Command, CommandDto } from "@/types/services/api";
import { allColumns } from "@/types/settings/commands";
import { Option } from "@components/ui/multiselect";
import {
  EditCommandModal,
  AddCommandModal,
  CommandTable,
} from "@/features/commands/modals";

function Commands() {
  const {
    commands,
    isLoading,
    toggleEnabled,
    deleteCommand,
    updateCommand,
    createCommand,
  } = useCommands();
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [isAddingCommand, setIsAddingCommand] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Option[]>(
    allColumns.map((column) => ({ label: column.label, value: column.key })),
  );

  const visibleCols = useMemo(
    () => visibleColumns.map((col) => col.value),
    [visibleColumns],
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
  };

  const handleDelete = async (id: number) => {
    await deleteCommand(id);
  };

  const handleCreate = async (command: CommandDto) => {
    await createCommand(command);
    setIsAddingCommand(false);
  };

  const handleUpdate = async (id: number, command: CommandDto) => {
    await updateCommand(id, command);
    setEditingCommand(null);
  };

  const handleToggleEnabled = async (id: number) => {
    await toggleEnabled(id);
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.some((col) => col.value === columnKey)
        ? prev.filter((col) => col.value !== columnKey)
        : [...prev, { label: columnKey, value: columnKey }],
    );
  };

  return (
    <div className="max-w-3xl flex flex-col items-start justify-start gap-4">
      <h1 className="text-xl font-medium">
        {commands.length} available commands
      </h1>

      <CommandTable
        commands={commands}
        visibleColumns={visibleCols}
        onEditAction={handleEdit}
        onDeleteAction={handleDelete}
        onToggleEnabledAction={handleToggleEnabled}
        onAddCommandAction={() => setIsAddingCommand(true)}
        onToggleColumnAction={toggleColumn}
      />

      {editingCommand && (
        <EditCommandModal
          command={editingCommand}
          onSave={handleUpdate}
          onCancel={() => setEditingCommand(null)}
          open={!!editingCommand}
          onOpenChange={() => setEditingCommand(null)}
        />
      )}

      {isAddingCommand && (
        <AddCommandModal
          onSave={handleCreate}
          onCancel={() => setIsAddingCommand(false)}
          open={isAddingCommand}
          onOpenChange={() => setIsAddingCommand(false)}
        />
      )}
    </div>
  );
}

export default Commands;
