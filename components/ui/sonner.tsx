import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "!border-destructive/25 !bg-red-50 !text-red-950 dark:!border-destructive/30 dark:!bg-red-950/90 dark:!text-red-50 [&_[data-description]]:!text-red-900/80 dark:[&_[data-description]]:!text-red-200/80",
          success:
            "!border-emerald-600/25 !bg-emerald-50 !text-emerald-950 dark:!border-emerald-500/30 dark:!bg-emerald-950/90 dark:!text-emerald-50",
          warning:
            "!border-amber-500/25 !bg-amber-50 !text-amber-950 dark:!border-amber-500/30 dark:!bg-amber-950/90 dark:!text-amber-50",
          info: "!border-blue-500/25 !bg-blue-50 !text-blue-950 dark:!border-blue-500/30 dark:!bg-blue-950/90 dark:!text-blue-50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
