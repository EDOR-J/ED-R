import { useLocation } from "wouter";
import { useCallback, useRef } from "react";

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function useViewTransitionNavigate() {
  const [, setLocation] = useLocation();
  const pendingRef = useRef(false);

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      if (pendingRef.current) {
        setLocation(to, options);
        return;
      }

      if (!supportsViewTransitions()) {
        setLocation(to, options);
        return;
      }

      pendingRef.current = true;
      const transition = (document as any).startViewTransition(() => {
        setLocation(to, options);
      });
      transition.finished.finally(() => {
        pendingRef.current = false;
      });
    },
    [setLocation],
  );

  return navigate;
}

export function navigateWithTransition(
  setLocation: (to: string, options?: { replace?: boolean }) => void,
  to: string,
  options?: { replace?: boolean },
) {
  if (!supportsViewTransitions()) {
    setLocation(to, options);
    return;
  }

  (document as any).startViewTransition(() => {
    setLocation(to, options);
  });
}
