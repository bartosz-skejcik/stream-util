"use client";

import { Label } from "@/components/ui/label";
import { Slider as UiSlider } from "@/components/ui/slider";
import {
  MinusCircleIcon,
  PlusCircleIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";

type Props = React.ComponentProps<typeof SliderPrimitive.Root> & {
  variant?: "volume" | "default";
  label?: string;
};

function Slider({
  value,
  onValueChange: setValueAction,
  defaultValue,
  variant = "default",
  label,
  ...props
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="mt-0.5">{label}</Label>
        <output className="text-sm font-medium tabular-nums">
          {value && value.length > 0 ? value[0] : defaultValue}
        </output>
      </div>
      <div className="flex items-center gap-2">
        {variant === "volume" ? (
          <VolumeX
            className="shrink-0 opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : (
          <MinusCircleIcon
            className="shrink-0 opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <UiSlider
          value={value}
          defaultValue={defaultValue}
          onValueChange={setValueAction}
          aria-label="Volume slider"
          {...props}
        />
        {variant === "volume" ? (
          <Volume2
            className="shrink-0 opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : (
          <PlusCircleIcon
            className="shrink-0 opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export default Slider;
