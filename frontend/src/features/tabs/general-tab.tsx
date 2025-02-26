"use client";

import { useNotificationStore } from "@/global/stores/notification-store";
import { CircleCheckIcon, XIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import { cn } from "@/lib/utils";

function GeneralTab() {
  const { notifications, removeNotification, markNotificationAsRead } =
    useNotificationStore();

  return (
    <div className="grid grid-cols-3 gap-6 grid-rows-3 h-full">
      <div className="col-span-1 row-span-3 gap-2 flex flex-col border border-border p-3 rounded-lg">
        <h2 className="text-lg font-medium">Notifications</h2>
        {notifications.map((notification, idx) => (
          <div
            onMouseMove={() => {
              if (notification.read) return;
              // Mark notification as read
              markNotificationAsRead(notification.content);
            }}
            key={idx}
            className={cn(
              "rounded-md border px-4 py-3 text-muted-foreground flex justify-between items-center",
              notification.read
                ? "border-border text-muted-foreground/65"
                : "border-green-500/50 text-green-600",
            )}
          >
            <p className="text-sm">
              <CircleCheckIcon
                className="me-3 -mt-0.5 inline-flex opacity-60"
                size={20}
                aria-hidden="true"
              />
              {notification.content}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground"
              onClick={() => {
                removeNotification(notification.content);
              }}
            >
              <XIcon size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GeneralTab;
