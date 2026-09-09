import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { ThemePresetInitializer } from "@/components/theme-preset-initializer";
import { inter } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "iKiot",
  description: "Ứng dụng quản lý cửa hàng iKiot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
          <SidebarConfigProvider>
            <ThemePresetInitializer />
            {children}
            <Toaster />
          </SidebarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
