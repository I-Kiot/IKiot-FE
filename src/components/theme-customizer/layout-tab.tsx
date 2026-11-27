"use client"

import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useSidebarConfig } from '@/contexts/sidebar-context'
import { useSidebar } from '@/components/ui/sidebar'
import { sidebarVariants, sidebarCollapsibleOptions, sidebarSideOptions } from '@/config/theme-customizer-constants'

export function LayoutTab() {
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } = useSidebarConfig()
  const { toggleSidebar, state: sidebarState } = useSidebar()

  const handleSidebarVariantSelect = (variant: "sidebar" | "floating" | "inset") => {
    updateSidebarConfig({ variant })
  }

  const handleSidebarCollapsibleSelect = (collapsible: "offcanvas" | "icon" | "none") => {
    updateSidebarConfig({ collapsible })
    
    // Chuyển sang chế độ icon khi sidebar đang mở thì tự thu gọn
    if (collapsible === "icon" && sidebarState === "expanded") {
      toggleSidebar()
    }
  }

  const handleSidebarSideSelect = (side: "left" | "right") => {
    updateSidebarConfig({ side })
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Kiểu dáng Sidebar</Label>
          {sidebarConfig.variant && (
            <p className="text-xs text-muted-foreground mt-1">
              {sidebarConfig.variant === "sidebar" && "Mặc định: Bố cục sidebar tiêu chuẩn"}
              {sidebarConfig.variant === "floating" && "Nổi: Sidebar dạng nổi có viền"}
              {sidebarConfig.variant === "inset" && "Lồng: Sidebar dạng lồng với các góc bo tròn"}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sidebarVariants.map((variant) => (
            <div
              key={variant.value}
              className={`relative p-4 border rounded-md cursor-pointer transition-colors ${
                sidebarConfig.variant === variant.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleSidebarVariantSelect(variant.value as "sidebar" | "floating" | "inset")}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold text-center">{variant.name}</div>
                <div className={`flex h-40 rounded border ${ variant.value === "inset" ? "bg-muted" : "bg-background" }`}>
                  <div 
                    className={`w-3.5 flex-shrink-0 bg-muted flex flex-col gap-1.5 p-1 ${
                      variant.value === "floating" ? "border-r m-1 rounded" :
                      variant.value === "inset" ? "m-1 ms-0 rounded bg-muted/80" :
                      "border-r"
                    }`}
                  >
                    <div className="h-0.5 w-full bg-foreground/60 rounded"></div>
                    <div className="h-0.5 w-3/4 bg-foreground/50 rounded"></div>
                    <div className="h-0.5 w-2/3 bg-foreground/40 rounded"></div>
                    <div className="h-0.5 w-3/4 bg-foreground/35 rounded"></div>
                    <div className="h-0.5 w-1/2 bg-foreground/30 rounded"></div>
                    <div className="h-0.5 w-2/3 bg-foreground/25 rounded"></div>
                    <div className="h-0.5 w-3/4 bg-foreground/20 rounded"></div>
                    <div className="h-0.5 w-1/2 bg-foreground/15 rounded"></div>
                    <div className="h-0.5 w-1/3 bg-foreground/10 rounded"></div>
                  </div>
                  <div className={`flex-1 ${ variant.value === "inset" ? "bg-background ms-0" : "bg-background/50" } m-1 rounded-sm border-dashed border border-muted-foreground/20`}>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Chế độ thu gọn Sidebar</Label>
          {sidebarConfig.collapsible && (
            <p className="text-xs text-muted-foreground mt-1">
              {sidebarConfig.collapsible === "offcanvas" && "Ẩn: Trượt hoàn toàn khỏi màn hình"}
              {sidebarConfig.collapsible === "icon" && "Thu nhỏ: Chỉ hiển thị icon"}
              {sidebarConfig.collapsible === "none" && "Không: Luôn hiển thị đầy đủ"}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sidebarCollapsibleOptions.map((option) => (
            <div
              key={option.value}
              className={`relative p-4 border rounded-md cursor-pointer transition-colors ${
                sidebarConfig.collapsible === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleSidebarCollapsibleSelect(option.value as "offcanvas" | "icon" | "none")}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold text-center">{option.name}</div>
                <div className="flex h-40 rounded border bg-background">
                  {option.value === "offcanvas" ? (
                    // Off-canvas: hiện trạng thái thu gọn với nút hamburger
                    <div className="flex-1 bg-background/50 m-1 rounded-sm border-dashed border border-muted-foreground/20 flex items-center justify-start pl-2">
                      <div className="flex flex-col gap-1">
                        <div className="w-3 h-0.5 bg-foreground/60 rounded"></div>
                        <div className="w-3 h-0.5 bg-foreground/60 rounded"></div>
                        <div className="w-3 h-0.5 bg-foreground/60 rounded"></div>
                      </div>
                    </div>
                  ) : option.value === "icon" ? (
                    // Icon mode: hiện sidebar icon mỏng
                    <>
                      <div className="w-4 flex-shrink-0 bg-muted flex flex-col gap-1.5 p-1 border-r items-center">
                        <div className="w-2 h-2 bg-foreground/60 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/40 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/30 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/20 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/15 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/10 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/10 rounded-sm"></div>
                        <div className="w-2 h-2 bg-foreground/5 rounded-sm"></div>
                      </div>
                      <div className="flex-1 bg-background/50 m-1 rounded-sm border-dashed border border-muted-foreground/20"></div>
                    </>
                  ) : (
                    // None: luôn hiện sidebar đầy đủ
                    <>
                      <div className="w-6 flex-shrink-0 bg-muted flex flex-col gap-1.5 p-1 border-r">
                        <div className="h-0.5 w-full bg-foreground/60 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/50 rounded"></div>
                        <div className="h-0.5 w-2/3 bg-foreground/40 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/35 rounded"></div>
                        <div className="h-0.5 w-1/2 bg-foreground/30 rounded"></div>
                        <div className="h-0.5 w-2/3 bg-foreground/25 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/20 rounded"></div>
                        <div className="h-0.5 w-1/2 bg-foreground/15 rounded"></div>
                        <div className="h-0.5 w-1/3 bg-foreground/10 rounded"></div>
                      </div>
                      <div className="flex-1 bg-background/50 m-1 rounded-sm border-dashed border border-muted-foreground/20"></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Vị trí Sidebar</Label>
          {sidebarConfig.side && (
            <p className="text-xs text-muted-foreground mt-1">
              {sidebarConfig.side === "left" && "Trái: Sidebar nằm ở phía bên trái"}
              {sidebarConfig.side === "right" && "Phải: Sidebar nằm ở phía bên phải"}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sidebarSideOptions.map((side) => (
            <div
              key={side.value}
              className={`relative p-4 border rounded-md cursor-pointer transition-colors ${
                sidebarConfig.side === side.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleSidebarSideSelect(side.value as "left" | "right")}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold text-center">{side.name}</div>
                <div className="flex h-40 rounded border bg-background">
                  {side.value === "left" ? (
                    // Sidebar bên trái
                    <>
                      <div className="w-6 flex-shrink-0 bg-muted flex flex-col gap-1.5 p-1 border-r">
                        <div className="h-0.5 w-full bg-foreground/60 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/50 rounded"></div>
                        <div className="h-0.5 w-2/3 bg-foreground/40 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/35 rounded"></div>
                        <div className="h-0.5 w-1/2 bg-foreground/30 rounded"></div>
                        <div className="h-0.5 w-2/3 bg-foreground/25 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/20 rounded"></div>
                        <div className="h-0.5 w-1/2 bg-foreground/15 rounded"></div>
                        <div className="h-0.5 w-1/3 bg-foreground/10 rounded"></div>
                      </div>
                      <div className="flex-1 bg-background/50 m-1 rounded-sm border-dashed border border-muted-foreground/20"></div>
                    </>
                  ) : (
                    // Sidebar bên phải
                    <>
                      <div className="flex-1 bg-background/50 m-1 rounded-sm border-dashed border border-muted-foreground/20"></div>
                      <div className="w-6 flex-shrink-0 bg-muted flex flex-col gap-1.5 p-1 border-l">
                        <div className="h-0.5 w-full bg-foreground/60 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/50 rounded"></div>
                        <div className="h-0.5 w-2/3 bg-foreground/40 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/35 rounded"></div>
                        <div className="h-0.5 w-1/2 bg-foreground/30 rounded"></div>
                        <div className="h-0.5 w-2/3 bg-foreground/25 rounded"></div>
                        <div className="h-0.5 w-3/4 bg-foreground/20 rounded"></div>
                        <div className="h-0.5 w-1/2 bg-foreground/15 rounded"></div>
                        <div className="h-0.5 w-1/3 bg-foreground/10 rounded"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
