"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePersonContext } from "@/context/PersonContext";

const ITEMS = [
  { href: "/tracker", label: "Tablero", icon: "▦" },
  { href: "/descubrir", label: "Descubrir", icon: "✦" },
  { href: "/dashboard", label: "Stats", icon: "◔" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { persona } = usePersonContext();

  if (!persona) return null;

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={"nav-item" + (pathname?.startsWith(item.href) ? " active" : "")}
        >
          <span className="nav-icon" aria-hidden>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
