"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Nhập tin nhắn...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setIsOverflowing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      setIsOverflowing(scrollHeight > 120);
    }
  };

  return (
    <div className="pb-4 pt-1 relative px-4 md:px-6">
      {/* Top fade gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-10 -translate-y-full bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            disabled={disabled}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none cursor-text disabled:cursor-not-allowed",
              "py-3 px-4 border border-input focus-visible:ring-1 focus-visible:ring-primary rounded-xl",
              isOverflowing ? "overflow-y-auto" : "overflow-y-hidden"
            )}
            rows={1}
          />
        </div>

        {/* Send button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSendMessage}
                disabled={disabled || !message.trim()}
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gửi tin nhắn</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
