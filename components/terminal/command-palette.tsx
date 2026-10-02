"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Command, Search, Terminal } from "lucide-react";
import { projects } from "@/data/projects";
import { useContacts } from "@/components/ui/contact-provider";
import { fuzzyScore } from "@/lib/fuzzy-search";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

export default function CommandPalette({
  onClose,
  onTerminal,
}: {
  onClose: () => void;
  onTerminal: () => void;
}) {
  const router = useRouter();
  const github = useContacts().find((item) => item.name === "GitHub");
  const dialog = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState("");
  const close = useCallback(() => onClose(), [onClose]);
  useDialogFocus(dialog, close);
  useEffect(() => {
    document.getElementById(`command-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const items = [
    { name: "Home", hint: "Return to the compute core", href: "/" },
    { name: "About", hint: "Engineer profile", href: "/#about" },
    { name: "Projects", hint: "Explore the full archive", href: "/projects" },
    { name: "Skills", hint: "Technology matrix", href: "/#skills" },
    { name: "Lab", hint: "Interactive engineering experiments", href: "/lab" },
    { name: "Contact", hint: "Establish a connection", href: "/#contact" },
    ...(github ? [{ name: "GitHub", hint: "Verified public GitHub profile", href: "github" }] : []),
    { name: "Terminal", hint: "Open the developer console", href: "terminal" },
    ...projects.map((project) => ({
      name: project.name,
      hint: `PROJECT_${project.id}`,
      href: `/projects/${project.slug}`,
    })),
  ];
  const cleaned = query
    .toLowerCase()
    .replace(/^>\s*/, "")
    .replace(/^(open|go)\s+/, "");
  const filtered = items
    .map((item) => ({ item, score: fuzzyScore(cleaned, `${item.name} ${item.hint} ${item.href}`) }))
    .filter(
      (entry): entry is { item: (typeof items)[number]; score: number } => entry.score !== null,
    )
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.item);
  function execute(href: string) {
    if (href === "github") {
      if (!github) return;
      window.open(github.url, "_blank", "noopener,noreferrer");
      onClose();
      return;
    }
    if (href === "terminal") {
      onTerminal();
      return;
    }
    router.push(href);
    onClose();
  }
  return (
    <div
      className="modal-backdrop palette-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        className="command-palette"
        data-system-state="FOCUS"
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
        tabIndex={-1}
      >
        <h2 className="sr-only" id="palette-title">
          Navigate Marcell.OS
        </h2>
        <div className="palette-input">
          <Search size={20} />
          <input
            data-autofocus
            aria-label="Search system commands"
            role="combobox"
            aria-expanded={true}
            aria-controls="palette-results"
            aria-autocomplete="list"
            aria-activedescendant={filtered[selected] ? `command-${selected}` : undefined}
            placeholder="Where do you want to go?"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
              setNotice("");
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelected((value) => (filtered.length ? (value + 1) % filtered.length : 0));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelected((value) =>
                  filtered.length ? (value - 1 + filtered.length) % filtered.length : 0,
                );
              }
              if (event.key === "Enter" && filtered[selected]) {
                event.preventDefault();
                execute(filtered[selected].href);
              }
            }}
          />
          <button className="key-button" onClick={onClose} aria-label="Close command palette">
            ESC
          </button>
        </div>
        <p className="palette-label mono">SYSTEM COMMAND MODE / DESTINATIONS</p>
        <div
          id="palette-results"
          role="listbox"
          aria-label="Command results"
          className="palette-results"
        >
          {filtered.map((item, i) => (
            <div
              key={item.name}
              id={`command-${i}`}
              role="option"
              aria-selected={selected === i}
              className={`palette-option ${selected === i ? "selected" : ""}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => execute(item.href)}
            >
              {item.href === "terminal" ? <Terminal size={19} /> : <ArrowUpRight size={19} />}
              <span>
                <strong>{item.name}</strong>
                <small>{item.hint}</small>
              </span>
              <kbd>↵</kbd>
            </div>
          ))}
          {!filtered.length && (
            <p className="palette-empty">No matching modules. Try “projects” or “lab”.</p>
          )}
        </div>
        <p className="palette-notice" role="status">
          {notice}
        </p>
        <div className="palette-footer mono">
          <span>
            <Command size={13} /> MARCELL.OS
          </span>
          <span>↑ ↓ NAVIGATE &nbsp; ↵ OPEN</span>
        </div>
      </div>
    </div>
  );
}
