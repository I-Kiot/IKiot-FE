"use client"

import { useEffect, useRef, useState } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { Sparkles, User, MessageSquare, HelpCircle, ArrowRight, Copy, Pencil, RotateCw } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type ChatMessage } from "@/lib/api/ai"
import { MarkdownRenderer } from "./markdown-renderer"

interface MessageListProps {
  messages: ChatMessage[];
  isSending?: boolean;
  onSelectSuggestion?: (prompt: string) => void;
  onSendMessage?: (content: string) => void;
}

const SUGGESTIONS = [
  {
    icon: Sparkles,
    title: "Thống kê doanh thu",
    desc: "Báo cáo doanh số và đơn hàng hôm nay",
    prompt: "Thống kê tình hình doanh thu và số đơn hàng của cửa hàng ngày hôm nay.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: MessageSquare,
    title: "Xu hướng thị trường",
    desc: "Hỏi AI xu hướng hot trend",
    prompt: "Sản phẩm nào đang là xu hướng bán chạy trên thị trường hiện nay?",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: HelpCircle,
    title: "Đơn hàng gần đây",
    desc: "Liệt kê các đơn hàng mới nhất",
    prompt: "Liệt kê danh sách các đơn hàng mới nhất của tôi.",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Sparkles,
    title: "Danh sách sản phẩm",
    desc: "Tìm các sản phẩm đang có",
    prompt: "Liệt kê các sản phẩm có trong danh mục của cửa hàng.",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
];

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

function Typewriter({ text, speed = 8, onComplete }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    let index = 0;
    setDisplayedText(text.charAt(0) || "");
    
    const interval = setInterval(() => {
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        onComplete?.();
        return;
      }
      const char = text.charAt(index);
      setDisplayedText((prev) => prev + char);

      // Smooth auto-scroll to the bottom as character by character is typed
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          const chatViewport = document.querySelector('[data-slot="scroll-area-viewport"]');
          if (chatViewport) {
            chatViewport.scrollTop = chatViewport.scrollHeight;
          }
        });
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <MarkdownRenderer content={displayedText} />;
}

export function MessageList({
  messages,
  isSending = false,
  onSelectSuggestion,
  onSendMessage,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const prevIsSendingRef = useRef(isSending);
  const [animatingMessageKey, setAnimatingMessageKey] = useState<string | null>(null);

  // Track transition of isSending to detect newly completed AI responses
  useEffect(() => {
    if (prevIsSendingRef.current && !isSending && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === "model") {
        const key = lastMsg.id || `msg-${messages.length - 1}`;
        setAnimatingMessageKey(key);
      }
    }
    prevIsSendingRef.current = isSending;
  }, [isSending, messages]);

  // Auto-scroll to bottom on new messages (with a short timeout to ensure DOM is fully rendered)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isSending]);

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Hôm qua ${format(date, "HH:mm")}`;
    } else {
      return format(date, "d MMM, HH:mm");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép tin nhắn vào bộ nhớ tạm.");
  };

  const startEditing = (idx: number, text: string) => {
    setEditingIndex(idx);
    setEditingText(text);
  };

  const handleSaveEdit = () => {
    if (!editingText.trim()) return;
    onSendMessage?.(editingText);
    setEditingIndex(null);
    setEditingText("");
  };

  const handleRetry = (idx: number) => {
    const prevMessage = messages[idx - 1];
    if (prevMessage && prevMessage.role === "user") {
      const text = prevMessage.parts.map((p) => p.text).join("");
      onSendMessage?.(text);
    }
  };

  return (
    <ScrollArea className="flex-1 h-0 w-full px-6" ref={scrollAreaRef}>
      <div className="space-y-6 py-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {/* AI Welcome Icon */}
            <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-inner mb-5 select-none animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1.5">
              Xin chào! Tôi có thể giúp gì cho bạn hôm nay?
            </h3>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed mb-8">
              Tôi là trợ lý AI của cửa hàng, được kết nối trực tiếp với dữ liệu doanh thu, sản phẩm và ca làm việc của bạn. Hãy chọn một câu hỏi gợi ý bên dưới hoặc tự nhập câu hỏi.
            </p>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              {SUGGESTIONS.map((sug, i) => {
                const Icon = sug.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectSuggestion?.(sug.prompt)}
                    disabled={isSending}
                    className="flex items-start gap-4 p-4 rounded-2xl border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group text-left cursor-pointer disabled:opacity-50"
                  >
                    <div className={cn("p-2.5 rounded-xl border shrink-0", sug.color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span>{sug.title}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {sug.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isUser = message.role === "user";
            const textContent = message.parts.map((p) => p.text).join("");
            const messageKey = message.id || `msg-${idx}`;
            const shouldAnimate = !isUser && animatingMessageKey === messageKey;

            return (
              <div
                key={idx}
                className={cn(
                  "flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2 duration-200 group relative",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <Avatar className={cn(
                  "h-8 w-8 shrink-0 select-none border shadow-sm",
                  isUser ? "bg-primary border-primary/20 text-primary-foreground" : "bg-card border-border text-foreground"
                )}>
                  <AvatarFallback className="text-xs bg-transparent">
                    {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble or Edit Form */}
                {editingIndex === idx ? (
                  <div className="flex flex-col gap-2 w-full max-w-[80%] items-end">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[80px] p-3 text-sm rounded-2xl border border-input bg-card text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors shadow-sm"
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "flex flex-col max-w-[80%]",
                    isUser ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-300",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card border border-border rounded-tl-none"
                    )}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
                      ) : (
                        shouldAnimate ? (
                          <Typewriter
                            text={textContent}
                            onComplete={() => {
                              setAnimatingMessageKey(null);
                            }}
                          />
                        ) : (
                          <MarkdownRenderer content={textContent} />
                        )
                      )}
                    </div>

                    {/* Toolbar & Timestamp */}
                    <div className={cn(
                      "flex items-center gap-2 mt-1.5 px-1 select-none",
                      isUser ? "justify-end" : "justify-start"
                    )}>
                      {isUser ? (
                        <>
                          {/* Floating Action Buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(textContent)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Sao chép"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => startEditing(idx, textContent)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="text-[10px] text-muted-foreground block">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-muted-foreground block">
                            {formatMessageTime(message.createdAt)}
                          </span>

                          {/* Floating Action Buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(textContent)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Sao chép"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRetry(idx)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Thử lại"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-4 items-start animate-in fade-in duration-200">
            <Avatar className="h-8 w-8 shrink-0 bg-card border border-border text-foreground select-none shadow-sm">
              <AvatarFallback className="text-xs bg-transparent">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start max-w-[80%]">
              <div className="bg-card border border-border rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 px-1 select-none">
                AI đang suy nghĩ...
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
