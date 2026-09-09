"use client";

import { Chat } from "./components/chat";

export default function ChatPage() {
  return (
    <div className="-mt-4 -mb-4 md:-mt-6 md:-mb-6 h-[calc(100vh-var(--header-height)-16px)] overflow-hidden">
      <Chat />
    </div>
  );
}
