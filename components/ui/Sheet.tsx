import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject
} from "react";
import { createPortal } from "react-dom";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement>;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
};

const focusableSelectors =
  'a[href], button, textarea, input[type="text"], input[type="email"], input[type="tel"], select, [tabindex]:not([tabindex="-1"])';

export const Sheet = ({
  open,
  onClose,
  labelledBy,
  children,
  initialFocusRef,
  closeOnOverlayClick = true,
  closeOnEsc = true
}: SheetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const handleFocusTrap = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current || event.key !== "Tab") {
        return;
      }

      const focusableEls = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusableEls.length === 0) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const firstElement = focusableEls[0];
      const lastElement = focusableEls[focusableEls.length - 1];

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    lastFocusedElementRef.current = document.activeElement as HTMLElement;

    const focusTarget = initialFocusRef?.current || containerRef.current;

    const timer = window.setTimeout(() => {
      focusTarget?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      handleFocusTrap(event);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedElementRef.current?.focus();
      lastFocusedElementRef.current = null;
    };
  }, [closeOnEsc, handleFocusTrap, initialFocusRef, onClose, open]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center">
      <div
        className="sheet-overlay"
        onClick={() => {
          if (closeOnOverlayClick) {
            onClose();
          }
        }}
      />
      <div
        aria-labelledby={labelledBy}
        role="dialog"
        aria-modal
        className="sheet-container"
        ref={containerRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export type { SheetProps };
