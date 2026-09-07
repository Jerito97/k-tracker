import type { Metadata } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { PersonProvider } from "@/context/PersonContext";
import { ToastProvider } from "@/context/ToastContext";
import { PersonGate } from "@/components/PersonGate";
import { BottomNav } from "@/components/BottomNav";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

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
    <html lang="es" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body>
        <div className="page-backdrop">
          <div className="phone-frame">
            <PersonProvider>
              <ToastProvider>
                <PersonGate>{children}</PersonGate>
                <BottomNav />
              </ToastProvider>
            </PersonProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
