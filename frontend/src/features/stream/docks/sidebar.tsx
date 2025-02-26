import { SettingsModal } from "@/features/commands/modals/settings-modal";
import { ModeToggle } from "@/features/ui/mode-toggle";
import { useTabs } from "@/global/context/tabs-context";
import { Button } from "@components/ui/button";
import { cn } from "@/lib/utils";

function Sidebar() {
  const { tabs, setActiveTab, activeTab } = useTabs();

  return (
    <div className="border border-border rounded-xl col-span-1 flex flex-col justify-between items-center p-2">
      <div className="w-full flex flex-col gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            size="icon"
            variant="outline"
            className={cn(
              "w-full aspect-square h-auto gap-0 p-0 size-full",
              activeTab === tab.id && "bg-primary/10",
            )}
          >
            {tab.icon}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <ModeToggle />
        <SettingsModal />
      </div>
    </div>
  );
}

export default Sidebar;
