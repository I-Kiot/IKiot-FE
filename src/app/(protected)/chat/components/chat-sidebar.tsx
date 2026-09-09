import React from "react";
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type ChatSession } from "@/lib/api/ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  conversations: ChatSession[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isSending: boolean;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onStartNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isSending,
}: ChatSidebarProps) {
  const handleRename = (
    id: string,
    currentTitle: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const newTitle = prompt("Nhập tên mới cho cuộc hội thoại:", currentTitle);
    if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
      onRenameConversation(id, newTitle.trim());
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này không?")) {
      onDeleteConversation(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 w-[270px] shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-card shrink-0">
        <div className="relative flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shadow-inner">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-xs leading-none text-foreground truncate">
            Trợ lý AI iKiot
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">Hoạt động</p>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3 bg-card/50 border-b shrink-0">
        <Button
          onClick={onStartNewConversation}
          disabled={isSending}
          className="w-full justify-start gap-2 rounded-xl h-10 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs font-medium">Cuộc hội thoại mới</span>
        </Button>
      </div>

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-1">
          Lịch sử trò chuyện
        </h4>
        {conversations.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chưa có cuộc hội thoại nào.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => !isSending && onSelectConversation(conv.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer group select-none",
                  isActive
                    ? "bg-card border-border shadow-sm text-primary font-medium"
                    : "hover:bg-card/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-xs truncate block pr-2">
                    {conv.title}
                  </span>
                </div>

                {/* Actions Dropdown */}
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={(e) => handleRename(conv.id, conv.title, e)}
                        className="cursor-pointer text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Đổi tên
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="cursor-pointer text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
