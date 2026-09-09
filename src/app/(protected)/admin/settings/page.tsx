"use client";

import * as React from "react";
import { Palette, Layout, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { ThemeTab } from "@/components/theme-customizer/theme-tab";
import { LayoutTab } from "@/components/theme-customizer/layout-tab";
import { useThemeManager } from "@/hooks/use-theme-manager";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { PageHeader } from "@/components/page-header";

type TabType = "theme" | "layout";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("theme");
  const { isDarkMode, resetTheme, applyRadius, applyTheme } = useThemeManager();
  const { updateConfig: updateSidebarConfig } = useSidebarConfig();

  // Theme states
  const [selectedTheme, setSelectedTheme] = React.useState("twitter");
  const [selectedRadius, setSelectedRadius] = React.useState("1rem");

  // Load Theme variables from local storage on mount
  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme-preset");
      const savedRadius = localStorage.getItem("theme-radius");
      if (savedTheme) {
        setTimeout(() => setSelectedTheme(savedTheme), 0);
      }
      if (savedRadius) {
        setTimeout(() => setSelectedRadius(savedRadius), 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Re-apply themes when theme mode changes
  React.useEffect(() => {
    if (selectedTheme) {
      applyTheme(selectedTheme, isDarkMode);
    }
  }, [isDarkMode, selectedTheme, applyTheme]);

  const handleResetTheme = () => {
    setSelectedTheme("twitter");
    setSelectedRadius("1rem");
    resetTheme();
    applyRadius("1rem");
    updateSidebarConfig({
      variant: "inset",
      collapsible: "offcanvas",
      side: "left",
    });
    try {
      localStorage.setItem("theme-preset", "twitter");
      localStorage.setItem("theme-radius", "1rem");
      localStorage.setItem("theme-border", "thick");
      toast.success("Đã khôi phục thiết kế giao diện mặc định!");
    } catch (e) {
      console.error(e);
    }
  };

  const sidebarItems = [
    {
      group: "GIAO DIỆN",
      items: [
        { id: "theme", label: "Chủ đề", icon: Palette },
        { id: "layout", label: "Bố cục", icon: Layout },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-4  lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Cấu hình" },
        ]}
        title="Cấu hình hệ thống"
        description="Quản lý các thiết lập và tùy chỉnh hệ thống."
      />
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-20 space-y-6">
          <nav className="space-y-6">
            {sidebarItems.map((group) => (
              <div key={group.group} className="space-y-1">
                <h4 className="px-3 text-[11px] font-bold text-muted-foreground/75 tracking-wider uppercase">
                  {group.group}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as TabType);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 w-full min-w-0 bg-card border rounded-xl shadow-xs overflow-hidden flex flex-col md:h-[calc(100vh-12rem)] md:max-h-[750px]">
          {/* Header of Active Section */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/10">
            <div>
              <h2 className="text-lg font-bold">
                {activeTab === "theme" && "Tùy biến chủ đề"}
                {activeTab === "layout" && "Cấu hình bố cục"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "theme" &&
                  "Điều chỉnh giao diện màu sắc, bo góc và chế độ hiển thị sáng tối."}
                {activeTab === "layout" &&
                  "Cấu hình cách bố trí của sidebar, chế độ thu nhỏ và vị trí hiển thị."}
              </p>
            </div>

            {/* Reset customizer options */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTheme}
              className="cursor-pointer text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Đặt lại mặc định
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Theme Settings */}
            {activeTab === "theme" && (
              <div className="border rounded-xl bg-card overflow-hidden">
                <ThemeTab
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                  selectedRadius={selectedRadius}
                  setSelectedRadius={setSelectedRadius}
                />
              </div>
            )}

            {/* Tab: Layout Settings */}
            {activeTab === "layout" && (
              <div className="border rounded-xl bg-card overflow-hidden">
                <LayoutTab />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
