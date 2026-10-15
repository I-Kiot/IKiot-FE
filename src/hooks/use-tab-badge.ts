"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useNotificationInboxStore } from "@/store/notification-inbox-store";

const TITLE_PREFIX = /^\(\d+\+?\)\s*/;

function iconLinks(): HTMLLinkElement[] {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
  );
}

/** The favicon with a red dot in its top-right corner, as a data URL; null when the icon cannot be drawn. */
function badgedIcon(source: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(image, 0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size - 16, 16, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

/**
 * Shows unread notifications on the browser tab: a "(3) " prefix on the title and a red dot on
 * the favicon, so someone working in another tab sees something is waiting. Cleared as soon
 * as the count reaches zero.
 */
export function useTabBadge() {
  const unreadCount = useNotificationInboxStore((state) => state.unreadCount);
  const pathname = usePathname();

  // Title. Next rewrites it on navigation, so the prefix is re-applied from the observer too.
  useEffect(() => {
    const apply = () => {
      const bare = document.title.replace(TITLE_PREFIX, "");
      const next = unreadCount > 0 ? `(${unreadCount > 99 ? "99+" : unreadCount}) ${bare}` : bare;
      if (document.title !== next) document.title = next;
    };
    apply();

    const titleEl = document.querySelector("title");
    if (!titleEl) return;
    const observer = new MutationObserver(apply);
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(TITLE_PREFIX, "");
    };
  }, [unreadCount, pathname]);

  // Favicon.
  useEffect(() => {
    let cancelled = false;
    const links = iconLinks();
    if (links.length === 0) return;

    // Remember the real icon once, so a later count of zero can put it back.
    for (const link of links) {
      if (!link.dataset.originalHref) link.dataset.originalHref = link.href;
    }
    const original = links[0].dataset.originalHref as string;

    if (unreadCount === 0) {
      for (const link of links) link.href = link.dataset.originalHref ?? link.href;
      return;
    }

    void badgedIcon(original).then((dataUrl) => {
      if (cancelled || !dataUrl) return;
      for (const link of iconLinks()) {
        if (!link.dataset.originalHref) link.dataset.originalHref = link.href;
        link.type = "image/png";
        link.href = dataUrl;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [unreadCount, pathname]);
}
