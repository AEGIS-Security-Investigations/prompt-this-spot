import * as LabelPrimitive from "@radix-ui/react-label";
import type * as React from "react";
import { cn } from "../lib/cn";

const Label = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>;
}) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
