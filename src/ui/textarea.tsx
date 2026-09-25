import type * as React from "react";
import { cn } from "../lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = ({
  ref,
  className,
  error,
  ...props
}: TextareaProps & {
  ref?: React.Ref<HTMLTextAreaElement>;
}) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background text-foreground dark:bg-background dark:text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // destructive token, not a raw palette red.
        error &&
          "border-destructive text-destructive focus-visible:ring-destructive",
        className
      )}
      aria-invalid={error}
      ref={ref}
      {...props}
    />
  );
};
Textarea.displayName = "Textarea";

export { Textarea };
