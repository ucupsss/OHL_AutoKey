import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoKey",
  description: "Bahasa Indonesia editor with autocomplete and spell checking.",
  icons: {
    icon: "/autokey-logo.png",
    shortcut: "/autokey-logo.png",
    apple: "/autokey-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
