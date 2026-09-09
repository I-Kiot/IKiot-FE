import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
}

export function ChatHeader({ onToggleSidebar }: ChatHeaderProps) {
  // Completely hide on desktop (lg:hidden) as requested, but preserve menu trigger on mobile
  return (
    <div className="lg:hidden flex items-center px-4 py-3 border-b bg-card">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="shrink-0 cursor-pointer mr-3 h-9 w-9"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <span className="text-xs font-semibold text-foreground">Trợ lý AI iKiot</span>
    </div>
  );
}
