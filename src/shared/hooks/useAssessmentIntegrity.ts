import { useCallback, useEffect, useRef, useState } from 'react';

export type AssessmentIntegrityViolation =
  | 'browser-export'
  | 'clipboard'
  | 'context-menu'
  | 'drag-drop'
  | 'print-screen'
  | 'secure-mode-exit'
  | 'tab-switch';

interface UseAssessmentIntegrityOptions {
  enabled?: boolean;
  obscureOnFocusLoss?: boolean;
  onViolation?: (violation: AssessmentIntegrityViolation) => void;
}

const CLIPBOARD_ALLOWED_SELECTOR = '[data-assessment-clipboard="allowed"]';
const INTERNAL_CLIPBOARD_SELECTOR = '[data-assessment-clipboard="internal"]';

export function isAssessmentClipboardAllowed(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(CLIPBOARD_ALLOWED_SELECTOR));
}

export function isInternalAssessmentClipboard(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERNAL_CLIPBOARD_SELECTOR));
}

const CLIPBOARD_KEYS = new Set(['a', 'c', 'v', 'x']);
const RESTRICTED_BROWSER_KEYS = new Set(['o', 'p', 's', 'u']);
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
    event.key === 'PrintScreen' ||
    (event.metaKey && event.shiftKey && ['3', '4', '5', 's'].includes(key)) ||
    (event.metaKey && (key === 'g' || (event.altKey && key === 'r')))
  ) {
    return 'print-screen';
  }
  if (
    event.key === 'F12' ||
    (primaryModifier && event.shiftKey && DEVELOPER_TOOL_KEYS.has(key)) ||
    (event.metaKey && event.altKey && DEVELOPER_TOOL_KEYS.has(key))
  ) {
    return null;
  }
  if (
    (primaryModifier && CLIPBOARD_KEYS.has(key)) ||
    (event.shiftKey && key === 'insert') ||
    (event.ctrlKey && key === 'insert')
  ) {
    return 'clipboard';
  }
  if (primaryModifier && RESTRICTED_BROWSER_KEYS.has(key)) {
    return 'browser-export';
  }
  return null;
}

/**
 * Applies best-effort browser-side assessment controls to one mounted surface.
 * These controls deter casual copying and shortcut use; they are not a security
 * boundary and cannot replace server-side proctoring or audit telemetry.
 */
export function useAssessmentIntegrity<T extends HTMLElement>({
  enabled = true,
  obscureOnFocusLoss = false,
  onViolation,
}: UseAssessmentIntegrityOptions = {}) {
  const targetRef = useRef<T>(null);
  const [target, setTarget] = useState<T | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isContentObscured, setIsContentObscured] = useState(false);
  const [isSecureModeActive, setIsSecureModeActive] = useState(false);
  const secureModeRequestedRef = useRef(false);
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

  const secureModeSupported = typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen);

  const enterSecureMode = useCallback(async () => {
    if (!target || !document.documentElement.requestFullscreen) return false;

    try {
      type SecureFullscreenOptions = FullscreenOptions & { keyboardLock?: 'browser' };
      await document.documentElement.requestFullscreen({ navigationUI: 'hide', keyboardLock: 'browser' } as SecureFullscreenOptions);
      secureModeRequestedRef.current = true;
      setIsSecureModeActive(true);
      setIsContentObscured(false);
      return true;
    } catch {
      return false;
    }
  }, [target]);

  useEffect(() => {
    if (!enabled) return;
    if (!target) return;

    const block = (event: Event, violation: AssessmentIntegrityViolation) => {
      event.preventDefault();
      event.stopPropagation();
      reportViolation(violation);
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (isAssessmentClipboardAllowed(event.target)) return;
      block(event, 'context-menu');
    };
    const handleClipboard = (event: ClipboardEvent) => {
      if (isAssessmentClipboardAllowed(event.target)) return;
      block(event, 'clipboard');
    };
    const handleDragDrop = (event: DragEvent) => block(event, 'drag-drop');
    const handleSelectStart = (event: Event) => {
      if (isInternalAssessmentClipboard(event.target)) return;
      block(event, 'clipboard');
    };
    const handleAuxClick = (event: MouseEvent) => {
      if (event.button === 1) block(event, 'clipboard');
    };
    const handleBeforeInput = (event: InputEvent) => {
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') {
        if (event.inputType === 'insertFromPaste' && isAssessmentClipboardAllowed(event.target)) return;
        block(event, event.inputType === 'insertFromPaste' ? 'clipboard' : 'drag-drop');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const violation = classifyAssessmentShortcut(event);
      if (
        violation === 'clipboard' &&
        (isAssessmentClipboardAllowed(event.target) || isInternalAssessmentClipboard(event.target))
      ) return;
      if (violation) block(event, violation);
    };
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === 'hidden';
      if (obscureOnFocusLoss) setIsContentObscured(isHidden);
      if (isHidden) reportViolation('tab-switch');
    };
    const handleWindowBlur = () => {
      if (!obscureOnFocusLoss) return;
      setIsContentObscured(true);
      reportViolation('tab-switch');
    };
    const handleWindowFocus = () => {
      if (obscureOnFocusLoss && document.visibilityState === 'visible') {
        setIsContentObscured(false);
      }
    };
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === document.documentElement;
      setIsSecureModeActive(isFullscreen);
      if (!isFullscreen && secureModeRequestedRef.current) {
        secureModeRequestedRef.current = false;
        reportViolation('secure-mode-exit');
      }
    };

    target.addEventListener('contextmenu', handleContextMenu, true);
    target.addEventListener('copy', handleClipboard, true);
    target.addEventListener('cut', handleClipboard, true);
    target.addEventListener('paste', handleClipboard, true);
    target.addEventListener('dragstart', handleDragDrop, true);
    target.addEventListener('dragover', handleDragDrop, true);
    target.addEventListener('drop', handleDragDrop, true);
    target.addEventListener('selectstart', handleSelectStart, true);
    target.addEventListener('auxclick', handleAuxClick, true);
    target.addEventListener('beforeinput', handleBeforeInput, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      target.removeEventListener('contextmenu', handleContextMenu, true);
      target.removeEventListener('copy', handleClipboard, true);
      target.removeEventListener('cut', handleClipboard, true);
      target.removeEventListener('paste', handleClipboard, true);
      target.removeEventListener('dragstart', handleDragDrop, true);
      target.removeEventListener('dragover', handleDragDrop, true);
      target.removeEventListener('drop', handleDragDrop, true);
      target.removeEventListener('selectstart', handleSelectStart, true);
      target.removeEventListener('auxclick', handleAuxClick, true);
      target.removeEventListener('beforeinput', handleBeforeInput, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, obscureOnFocusLoss, reportViolation, target]);

  return {
    bindTarget,
    enterSecureMode,
    isContentObscured,
    isSecureModeActive,
    secureModeSupported,
    targetRef,
    violationCount,
  };
}
