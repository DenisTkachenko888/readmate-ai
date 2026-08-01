import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { TelegramInit } from "@/components/telegram-init";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import { FloatingAudioPlayer } from "@/components/floating-audio-player";
import { OfflineIndicator } from "@/components/offline-indicator";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appName = "ReadMateAI";

export const metadata: Metadata = {
  title: appName,
  description: "Персональная AI-библиотека",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn("dark font-sans", geist.variable)}>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        <TelegramInit />
        <BridgeProvider />
        <OfflineIndicator />
        <AudioPlayerProvider>
          <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090713]/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 max-w-4xl items-center px-4">
              <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
                <Image
                  src="/emblem-book-brain.png"
                  alt="ReadMateAI"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 12px rgba(168, 85, 247, 0.7)) drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))",
                  }}
                />
                {appName}
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <FloatingAudioPlayer />
          <Toaster richColors position="top-right" />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
