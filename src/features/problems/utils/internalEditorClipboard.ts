export type InternalEditorClipboardAction = 'copy' | 'cut' | 'paste';

export interface ClipboardShortcutLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

/**
 * Recognizes editor-local clipboard shortcuts. The caller owns the copied text
 * in memory and must prevent the native clipboard event, so source never enters
 * the operating-system clipboard.
 */
export function getInternalEditorClipboardAction(
  event: ClipboardShortcutLike
): InternalEditorClipboardAction | null {
  const key = event.key.toLowerCase();
  const primaryModifier = event.ctrlKey || event.metaKey;
  if (primaryModifier && key === 'c') return 'copy';
  if (primaryModifier && key === 'x') return 'cut';
  if (primaryModifier && key === 'v') return 'paste';
  if (event.ctrlKey && key === 'insert') return 'copy';
  if (event.shiftKey && key === 'insert') return 'paste';
  return null;
}

