import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { CogIcon, CommandIcon, HomeIcon, TvIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@components/ui/sidebar";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@components/ui/breadcrumb";
import { General, Stream, Commands } from "@/features/commands/settings";

type Tab = {
  name: string;
  icon: React.FC;
  component?: React.ReactNode;
};

export function SettingsModal() {
  const data = {
    nav: [
      { name: "General", icon: HomeIcon, component: <General /> },
      { name: "Stream", icon: TvIcon, component: <Stream /> },
      { name: "Commands", icon: CommandIcon, component: <Commands /> },
    ] as Tab[],
  };

  const [selectedTab, setSelectedTab] = useState<Tab>(data.nav[0]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-full aspect-square h-auto"
        >
          <CogIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[700px] lg:max-w-[1000px] xl:max-w-6xl">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <h3 className="pl-2 mb-2 font-medium text-lg">Settings</h3>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === selectedTab.name}
                          onClick={() => setSelectedTab(item)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      Settings
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedTab.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col h-full gap-4 overflow-y-auto p-4 pt-0">
              {selectedTab.component}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
