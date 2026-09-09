"use client";

import { Plus, X, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InvoiceTab {
  id: string;
  tabName: string;
}

interface CheckoutTabsProps {
  tabs: InvoiceTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabAdd: () => void;
  onTabClose: (id: string) => void;
}

export function CheckoutTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabAdd,
  onTabClose,
}: CheckoutTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b pb-1 overflow-x-auto select-none no-scrollbar">
      <div className="flex items-center gap-1.5 flex-nowrap">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group relative flex items-center gap-3 px-5 py-3 text-base font-bold rounded-t-lg border-t border-x cursor-pointer transition-all duration-200",
                isActive
                  ? "bg-background border-border text-primary shadow-[0_-2px_8px_rgba(0,0,0,0.05)] translate-y-[1px] z-10"
                  : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Receipt className={cn("size-3.5", isActive ? "text-primary animate-pulse" : "text-muted-foreground")} />
              <span>{tab.tabName}</span>

              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="size-3.5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-all ml-1.5 opacity-60 group-hover:opacity-100"
                >
                  <X className="size-2.5" />
                </button>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onTabAdd}
        className="size-7 rounded-md cursor-pointer text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
        title="Thêm hóa đơn mới (Ctrl+I)"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
