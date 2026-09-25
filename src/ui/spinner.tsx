import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

interface SpinnerProps extends React.OutputHTMLAttributes<HTMLOutputElement> {
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Optional text displayed below the spinner */
  text?: string;
}

export function Spinner({
  size = "default",
  className,
  text,
  ...props
}: SpinnerProps) {
  return (
    <output
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      <Loader2
        aria-hidden="true"
        className={cn("animate-spin motion-reduce:animate-none", {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "default",
          "h-8 w-8": size === "lg",
        })}
      />
      {/*
        Exactly one label lives in this live region. With `text`, the visible
        caption *is* the status and the generic "Loading" would make a screen
        reader announce both ("Loading Loading items…"); without it, the
        sr-only text is the only thing the icon has to say.
      */}
      {text ? (
        <p className="text-sm text-muted-foreground mt-0">{text}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </output>
  );
}
