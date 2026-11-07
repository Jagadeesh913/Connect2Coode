import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

/**
 * Keep Monaco entirely inside the application bundle.
 *
 * `@monaco-editor/react` otherwise downloads AMD loader.js from jsDelivr,
 * which is intentionally rejected by the production `script-src 'self'` CSP.
 * Vite emits these workers as same-origin assets covered by `worker-src`.
 */
globalThis.MonacoEnvironment = {
  getWorker(_moduleId: string, label: string): Worker {
    if (label === 'typescript' || label === 'javascript') {
      return new TypeScriptWorker();
    }
    return new EditorWorker();
  },
};

loader.config({ monaco });

