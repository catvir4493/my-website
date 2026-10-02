"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal as TerminalIcon, X } from "lucide-react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { runCommand, terminalCommands } from "@/lib/terminal";
import { system } from "@/data/system";
import { useContacts } from "@/components/ui/contact-provider";

type Entry = { id: number; command?: string; lines: string[] };
export default function Terminal({
  onClose,
  onMatrix,
}: {
  onClose: () => void;
  onMatrix: (enabled: boolean) => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: 0,
      lines: [
        `MARCELL.OS [Version ${system.version}] — ${system.release}`,
        "A small terminal. An open invitation to explore.",
        "Type help to discover the system.",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const contacts = useContacts();
  const completion = useRef<{ matches: string[]; index: number } | null>(null);
  const historyIndex = useRef(-1);
  const draft = useRef("");
  const id = useRef(0);
  const dialog = useRef<HTMLDivElement>(null);
  const output = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const close = useCallback(() => onClose(), [onClose]);
  useDialogFocus(dialog, close);
  useEffect(() => {
    output.current?.scrollTo({ top: output.current.scrollHeight, behavior: "instant" });
  }, [entries]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    const command = input.trim();
    const result = runCommand(command, { history: [...history, command], contacts });
    completion.current = null;
    setInput("");
    setHistory((value) => [...value.slice(-199), command]);
    historyIndex.current = -1;
    if (result.action === "clear") setEntries([]);
    else
      setEntries((value) => [
        ...value.slice(-79),
        { id: ++id.current, command, lines: result.lines },
      ]);
    if (result.action === "matrix" || result.action === "stop-matrix")
      onMatrix(result.action === "matrix");
    if (result.action === "github" && result.path)
      window.open(result.path, "_blank", "noopener,noreferrer");
    if (result.action === "close") onClose();
    if (result.action === "navigate" && result.path) {
      router.push(result.path);
      onClose();
    }
  }
  return (
    <div
      className="modal-backdrop terminal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        className="terminal-window"
        data-system-state="FOCUS"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminal-title"
        tabIndex={-1}
      >
        <div className="terminal-titlebar">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <h2 id="terminal-title">
            <TerminalIcon size={14} /> marcell@bme: ~
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="Close terminal">
            <X size={19} />
          </button>
        </div>
        <div
          className="terminal-output"
          ref={output}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {entries.map((entry) => (
            <div className="terminal-entry" key={entry.id}>
              {entry.command && (
                <p className="terminal-command">
                  <span>marcell@bme:~$</span> {entry.command}
                </p>
              )}
              {entry.lines.map((line, index) => (
                <p key={index}>{line || "\u00a0"}</p>
              ))}
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="terminal-input">
          <label htmlFor="terminal-command">marcell@bme:~$</label>
          <input
            data-autofocus
            id="terminal-command"
            aria-label="Terminal command"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              historyIndex.current = -1;
              completion.current = null;
            }}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
                event.preventDefault();
                setEntries([]);
                return;
              }
              if (event.key !== "Tab") completion.current = null;
              if (event.key === "ArrowUp") {
                event.preventDefault();
                if (!history.length) return;
                if (historyIndex.current === -1) {
                  draft.current = input;
                  historyIndex.current = history.length - 1;
                } else historyIndex.current = Math.max(0, historyIndex.current - 1);
                setInput(history[historyIndex.current]);
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (historyIndex.current === -1) return;
                historyIndex.current++;
                if (historyIndex.current >= history.length) {
                  historyIndex.current = -1;
                  setInput(draft.current);
                } else setInput(history[historyIndex.current]);
              }
              if (event.key === "Tab" && input && !event.shiftKey) {
                const matches =
                  completion.current?.matches ||
                  terminalCommands.filter((command) => command.startsWith(input.toLowerCase()));
                if (matches.length) {
                  event.preventDefault();
                  const index = completion.current
                    ? (completion.current.index + 1) % matches.length
                    : 0;
                  completion.current = { matches, index };
                  setInput(matches[index]);
                }
              }
            }}
          />
          <button type="submit" className="terminal-submit" aria-label="Execute command">
            ↵
          </button>
        </form>
        <div className="terminal-footer mono">
          <span>ENTER TO EXECUTE / ESC TO CLOSE</span>
          <span>SESSION LOCAL</span>
        </div>
      </div>
    </div>
  );
}
