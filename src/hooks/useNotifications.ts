import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const safeNotificationPermission = (): NotificationPermission | "denied" => {
  try {
    if (typeof Notification === "undefined") return "denied";
    return Notification.permission;
  } catch {
    return "denied";
  }
};

const safeLocalGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const sendNotification = (title: string, body: string, icon?: string) => {
  if (safeNotificationPermission() !== "granted") return;
  if (safeLocalGet("stb_notifications") !== "true") return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: "stb-notification",
    });
  } catch {
    // Notification API not supported — silently ignore
  }
};

export const useNotifications = (userId: string | undefined) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const isEnabled = () =>
      safeNotificationPermission() === "granted" &&
      safeLocalGet("stb_notifications") === "true";

    if (!isEnabled()) return;

    const channel = supabase
      .channel(`bet-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bets",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const bet = payload.new;
          if (!isEnabled()) return;

          if (bet.status === "won") {
            sendNotification(
              "🏆 You Won!",
              `Congratulations! Your bet of ₹${bet.amount} won! Check your wallet.`
            );
          } else if (bet.status === "lost") {
            sendNotification(
              "Better luck next time",
              `Your bet of ₹${bet.amount} did not win this time.`
            );
          } else if (bet.status === "cancelled") {
            sendNotification(
              "Bet Cancelled",
              `Your bet of ₹${bet.amount} has been cancelled and refunded.`
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);
};
