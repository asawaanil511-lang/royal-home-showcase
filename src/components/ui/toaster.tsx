import { Info, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive";
        return (
          <Toast key={id} {...props} variant={variant}>
            {/* Icon badge */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{
                background: isDestructive ? "rgba(239,68,68,0.20)" : "rgba(157,76,204,0.25)",
                border: isDestructive ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(157,76,204,0.40)",
              }}
            >
              {isDestructive
                ? <AlertCircle className="h-4 w-4 text-red-400" />
                : <Info className="h-4 w-4" style={{ color: "hsl(277 54% 65%)" }} />
              }
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>

            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
