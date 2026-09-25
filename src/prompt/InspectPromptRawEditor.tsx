"use client";

import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { cn } from "../lib/cn";
import { useIsDarkMode } from "../lib/useIsDarkMode";
import { CodeMirrorErrorBoundary } from "../ui/CodeMirrorErrorBoundary";
import {
  inspectPromptRawEditorShell,
  inspectPromptRawPreviewPanel,
} from "./inspectPromptChromeClasses";

type InspectPromptRawEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Editable CodeMirror surface for the assembled inspect prompt.
 */
export const InspectPromptRawEditor = ({
  value,
  onChange,
}: InspectPromptRawEditorProps) => {
  const isDark = useIsDarkMode();

  const fallback = (
    <textarea
      data-testid="inspect-prompt-raw-preview-fallback"
      className={cn(
        inspectPromptRawPreviewPanel,
        "min-h-[16rem] max-h-[min(60vh,28rem)] w-full resize-none"
      )}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Raw prompt"
    />
  );

  return (
    <div
      data-testid="inspect-prompt-raw-preview"
      className={inspectPromptRawEditorShell}
    >
      <CodeMirrorErrorBoundary fallback={fallback}>
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={[
            EditorView.lineWrapping,
            EditorView.theme({
              "&.cm-focused": { outline: "none" },
              ".cm-scroller": { overflow: "auto" },
            }),
          ]}
          theme={isDark ? "dark" : "light"}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            searchKeymap: false,
            closeBrackets: false,
            autocompletion: false,
            highlightSelectionMatches: false,
          }}
        />
      </CodeMirrorErrorBoundary>
    </div>
  );
};
