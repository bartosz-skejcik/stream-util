import { CircleCheck, Info, OctagonAlert, X, XCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  t: string | number;
  variant?: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
};

export function Toast({ t, variant, title, description }: Props) {
  return (
    <div className="w-[var(--width)] rounded-lg border border-border bg-background px-4 py-3">
      <div className="flex gap-2">
        <div className="flex grow gap-3">
          {icon({
            variant,
            className: cn("shrink-0 mt-0.5", textColor(variant)),
            ariaHidden: true,
          })}
          <div className="flex flex-col items-start grow justify-between">
            <p className="text-md">{title}</p>
            {description && <p className="text-sm opacity-60">{description}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
          onClick={() => toast.dismiss(t)}
          aria-label="Close banner"
        >
          <X
            size={16}
            strokeWidth={2}
            className="opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>
  );
}

const textColor = (variant: Props["variant"]) => {
  switch (variant) {
    case "success":
      return "text-emerald-500";
    case "error":
      return "text-red-500";
    case "warning":
      return "text-yellow-500";
    case "info":
      return "text-blue-500";
    default:
      return "text-foreground";
  }
};

const icon = ({
  variant,
  className,
  ariaHidden,
}: {
  variant: Props["variant"];
  className: string;
  ariaHidden: boolean;
}) => {
  switch (variant) {
    case "success":
      return (
        <CircleCheck
          size={16}
          strokeWidth={2}
          className={className}
          aria-hidden={ariaHidden}
        />
      );
    case "error":
      return (
        <XCircle
          size={16}
          strokeWidth={2}
          className={className}
          aria-hidden={ariaHidden}
        />
      );
    case "warning":
      return (
        <OctagonAlert
          size={16}
          strokeWidth={2}
          className={className}
          aria-hidden={ariaHidden}
        />
      );
    case "info":
      return (
        <Info
          size={16}
          strokeWidth={2}
          className={className}
          aria-hidden={ariaHidden}
        />
      );
    default:
      return null;
  }
};
