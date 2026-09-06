"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePersonContext } from "@/context/PersonContext";

const ITEMS = [
  { href: "/tracker", label: "Tracker", icon: "\u{1F4FA}" },
  { href: "/buscar", label: "Buscar", icon: "\u{1F50D}" },
  { href: "/dashboard", label: "Stats", icon: "\u{1F4CA}" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { persona, clearPersona } = usePersonContext();

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
      <button className="nav-item nav-item-persona" onClick={clearPersona} title="Cambiar de persona">
        <span className="nav-icon" aria-hidden>
          👤
        </span>
        <span>{persona}</span>
      </button>
    </nav>
  );
}
