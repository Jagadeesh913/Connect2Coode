import { useEffect, useMemo, useRef } from 'react';

/** Lock synchronously (including keyboard events) and discard results after scope changes.
 * Aborting the HTTP wait does not claim to cancel a Judge0 job already accepted by the server.
 */
export function useExecutionRequest(scope: string) {
  const owner = useRef<AbortController | null>(null);
  useEffect(() => {
    owner.current = null;
    return () => {
      owner.current?.abort();
      owner.current = null;
    };
  }, [scope]);
  return useMemo(() => ({
    begin() {
      if (owner.current) return null;
      const controller = new AbortController();
      owner.current = controller;
      return controller;
    },
    finish(controller: AbortController) {
      if (owner.current !== controller) return false;
      owner.current = null;
      return !controller.signal.aborted;
    },
  }), []);
}
