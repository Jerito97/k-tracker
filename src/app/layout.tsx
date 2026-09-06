import type { Metadata } from "next";
import "./globals.css";
import { PersonProvider } from "@/context/PersonContext";
import { PersonGate } from "@/components/PersonGate";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "K-Tracker",
  description: "Trackeá k-dramas y películas coreanas con tus amigas",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PersonProvider>
          <PersonGate>{children}</PersonGate>
          <BottomNav />
        </PersonProvider>
      </body>
    </html>
  );
}
