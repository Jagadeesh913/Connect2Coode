import { useCallback, useEffect, useRef, useState } from 'react';

export type AssessmentIntegrityViolation =
  | 'clipboard'
  | 'context-menu'
  | 'developer-tools'
  | 'drag-drop'
  | 'print-screen'
  | 'tab-switch';

interface UseAssessmentIntegrityOptions {
  enabled?: boolean;
  onViolation?: (violation: AssessmentIntegrityViolation) => void;
}

const CLIPBOARD_KEYS = new Set(['c', 'v', 'x']);
const RESTRICTED_BROWSER_KEYS = new Set(['p', 's', 'u']);
const DEVELOPER_TOOL_KEYS = new Set(['c', 'i', 'j']);

type AssessmentShortcut = Pick<
  KeyboardEvent,
  'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
>;

export function classifyAssessmentShortcut(
  event: AssessmentShortcut
): AssessmentIntegrityViolation | null {
  const key = event.key.toLowerCase();
  const primaryModifier = event.ctrlKey || event.metaKey;
  if (
    (primaryModifier && CLIPBOARD_KEYS.has(key)) ||
    (event.shiftKey && key === 'insert') ||
    (event.ctrlKey && key === 'insert')
  ) {
    return 'clipboard';
  }
  if (
    event.key === 'F12' ||
    (primaryModifier && event.shiftKey && DEVELOPER_TOOL_KEYS.has(key)) ||
    (primaryModifier && RESTRICTED_BROWSER_KEYS.has(key))
  ) {
    return 'developer-tools';
  }
  return event.key === 'PrintScreen' ? 'print-screen' : null;
}

/**
 * Applies best-effort browser-side assessment controls to one mounted surface.
 * These controls deter casual copying and shortcut use; they are not a security
 * boundary and cannot replace server-side proctoring or audit telemetry.
 */
export function useAssessmentIntegrity<T extends HTMLElement>({
  enabled = true,
  onViolation,
}: UseAssessmentIntegrityOptions = {}) {
  const targetRef = useRef<T>(null);
  const [target, setTarget] = useState<T | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const callbackRef = useRef(onViolation);
  callbackRef.current = onViolation;

  const reportViolation = useCallback((violation: AssessmentIntegrityViolation) => {
    setViolationCount((count) => count + 1);
    callbackRef.current?.(violation);
  }, []);

  const bindTarget = useCallback((node: T | null) => {
    targetRef.current = node;
    setTarget(node);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!target) return;

    const block = (event: Event, violation: AssessmentIntegrityViolation) => {
      event.preventDefault();
      event.stopPropagation();
      reportViolation(violation);
    };

    const handleContextMenu = (event: MouseEvent) => block(event, 'context-menu');
    const handleClipboard = (event: ClipboardEvent) => block(event, 'clipboard');
    const handleDragDrop = (event: DragEvent) => block(event, 'drag-drop');
    const handleBeforeInput = (event: InputEvent) => {
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') {
        block(event, event.inputType === 'insertFromPaste' ? 'clipboard' : 'drag-drop');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const violation = classifyAssessmentShortcut(event);
      if (violation) block(event, violation);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') reportViolation('tab-switch');
    };

    target.addEventListener('contextmenu', handleContextMenu, true);
    target.addEventListener('copy', handleClipboard, true);
    target.addEventListener('cut', handleClipboard, true);
    target.addEventListener('paste', handleClipboard, true);
    target.addEventListener('dragstart', handleDragDrop, true);
    target.addEventListener('drop', handleDragDrop, true);
    target.addEventListener('beforeinput', handleBeforeInput, true);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      target.removeEventListener('contextmenu', handleContextMenu, true);
      target.removeEventListener('copy', handleClipboard, true);
      target.removeEventListener('cut', handleClipboard, true);
      target.removeEventListener('paste', handleClipboard, true);
      target.removeEventListener('dragstart', handleDragDrop, true);
      target.removeEventListener('drop', handleDragDrop, true);
      target.removeEventListener('beforeinput', handleBeforeInput, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, reportViolation, target]);

  return { bindTarget, targetRef, violationCount };
}
