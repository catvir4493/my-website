"use client";
import { useEffect, type RefObject } from "react";

export function useDialogFocus(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = ref.current;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      (
        el?.querySelector<HTMLElement>("[data-autofocus]") ||
        el?.querySelector<HTMLElement>("input, button, a[href]") ||
        el
      )?.focus();
    });
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !el) return;
      const nodes = [
        ...el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, [tabindex="0"]',
        ),
      ].filter((node) => node.getClientRects().length > 0);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first) {
        event.preventDefault();
        el.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = bodyOverflow;
      requestAnimationFrame(() => previous?.focus());
    };
  }, [ref, onClose]);
}
