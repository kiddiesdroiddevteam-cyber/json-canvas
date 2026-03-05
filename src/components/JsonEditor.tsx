import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Copy, Check, Download, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename?: string;
}

const JsonEditor = ({ value, onChange, filename }: JsonEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleChange = useCallback((val: string | undefined) => {
    const v = val ?? "";
    onChange(v);
    try {
      JSON.parse(v);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }, [onChange]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2);
      onChange(formatted);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  };

  const handleDownload = () => {
    try {
      JSON.parse(value);
      const blob = new Blob([value], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ? filename.replace(/\.pdf$/i, ".json") : "data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* invalid json */ }
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border shadow-lg animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-destructive/70" />
            <span className="w-3 h-3 rounded-full bg-primary/70" />
            <span className="w-3 h-3 rounded-full bg-secondary-foreground/30" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2">
            {filename ?? "output.json"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFormat}
            title="Format JSON"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Format
          </button>
          <button
            onClick={handleCopy}
            title="Copy JSON"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              copied
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            title="Download JSON"
            disabled={!!parseError}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              "text-muted-foreground hover:text-foreground hover:bg-secondary",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Error banner */}
      {parseError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-b border-destructive/30 text-destructive text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{parseError}</span>
        </div>
      )}

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            renderLineHighlight: "line",
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
};

export default JsonEditor;
