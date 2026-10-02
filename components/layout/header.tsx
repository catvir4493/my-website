"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Command, Menu, X } from "lucide-react";
import { openPalette } from "@/lib/events";
import { useMotionPreferences } from "@/components/ui/motion-provider";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/#skills" },
  { label: "Lab", href: "/lab" },
  { label: "Contact", href: "/#contact" },
];
export function Header() {
  const [time, setTime] = useState("--:--:--");
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const { dormant } = useMotionPreferences();
  useEffect(() => {
    if (dormant) return;
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Budapest",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    const kickoff = requestAnimationFrame(update);
    const interval = setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(kickoff);
      clearInterval(interval);
    };
  }, [dormant]);
  return (
    <header className="status-bar">
      <Link href="/" className="brand" aria-label="Marcell.OS home">
        <span className="brand-mark" aria-hidden="true">
          M<span>_</span>
        </span>
        <span>
          MARCELL<span className="text-cyan">.OS</span>
          <small aria-hidden="true">PERSONAL OPERATING SYSTEM</small>
        </span>
      </Link>
      <nav className={menu ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
        {links.map((link, index) => (
          <Link
            key={link.label}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
            onClick={() => setMenu(false)}
          >
            <span className="nav-number">0{index + 1}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="header-status">
        <span className="online">
          <i /> SYSTEM ONLINE
        </span>
        <span className="header-time">
          {time}
          <small>BUDAPEST, HU</small>
        </span>
      </div>
      <button
        className="icon-button palette-trigger"
        onClick={openPalette}
        aria-label="Open command palette, Control K"
      >
        <Command size={16} />
        <kbd>K</kbd>
      </button>
      <button
        className="icon-button mobile-menu"
        onClick={() => setMenu(!menu)}
        aria-expanded={menu}
        aria-label={menu ? "Close navigation" : "Open navigation"}
      >
        {menu ? <X /> : <Menu />}
      </button>
    </header>
  );
}
