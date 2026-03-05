import { useState, useCallback } from "react";
import { FileText, FileJson, Loader2, X, ChevronRight, Braces } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import JsonEditor from "@/components/JsonEditor";
import { pdfToJson } from "@/lib/pdfToJson";
import { cn } from "@/lib/utils";

type Mode = "idle" | "loading" | "editor";

const Index = () => {
  const [mode, setMode] = useState<Mode>("idle");
  const [jsonValue, setJsonValue] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const handlePdf = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF file.");
      return;
    }
    setError(null);
    setMode("loading");
    setFilename(file.name);
    setProgress("Parsing PDF...");
    try {
      const data = await pdfToJson(file);
      setProgress("Formatting JSON...");
      setJsonValue(JSON.stringify(data, null, 2));
      setMode("editor");
    } catch (e) {
      setError(`Failed to parse PDF: ${(e as Error).message}`);
      setMode("idle");
    }
  }, []);

  const handleJson = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Please upload a valid JSON file.");
      return;
    }
    setError(null);
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        JSON.parse(text); // validate
        setJsonValue(JSON.stringify(JSON.parse(text), null, 2));
        setMode("editor");
      } catch {
        setError("Invalid JSON file. Please check the file contents.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleReset = () => {
    setMode("idle");
    setJsonValue("");
    setFilename(undefined);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg gradient-amber">
              <Braces className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              PDF<span className="text-gradient-amber">JSON</span>
            </span>
          </div>
          {mode === "editor" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-3.5 h-3.5" />
              New file
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8 gap-6">
        {/* Hero — only on idle */}
        {mode === "idle" && (
          <div className="flex flex-col items-center text-center gap-2 pt-6 pb-2 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight">
              Convert &amp; Edit{" "}
              <span className="text-gradient-amber">PDF / JSON</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Upload a PDF to extract its content as structured JSON, or load an existing JSON file — then edit it directly in the browser.
            </p>
          </div>
        )}

        {/* Upload cards */}
        {mode === "idle" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
            <UploadZone
              accept=".pdf"
              label="Upload PDF"
              description="Converts PDF content to structured JSON"
              icon="pdf"
              onFile={handlePdf}
            />
            <UploadZone
              accept=".json"
              label="Upload JSON"
              description="Load and edit an existing JSON file"
              icon="json"
              onFile={handleJson}
            />
          </div>
        )}

        {/* How it works — idle only */}
        {mode === "idle" && (
          <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-muted-foreground animate-fade-in">
            {["Upload PDF or JSON", "Content extracted automatically", "Edit JSON in browser", "Download result"].map(
              (step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary font-mono text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                  {i < 3 && <ChevronRight className="w-3 h-3" />}
                </div>
              )
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm animate-fade-in">
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading state */}
        {mode === "loading" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 animate-fade-in">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl gradient-amber flex items-center justify-center glow-amber">
                <FileText className="w-7 h-7 text-primary-foreground" />
              </div>
              <Loader2 className="w-5 h-5 absolute -top-1 -right-1 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{progress}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{filename}</p>
            </div>
          </div>
        )}

        {/* Editor */}
        {mode === "editor" && (
          <div className="flex flex-col flex-1 gap-3 animate-slide-up" style={{ minHeight: "calc(100vh - 200px)" }}>
            {/* File info bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border text-xs">
              <FileJson className="w-4 h-4 text-primary shrink-0" />
              <span className="font-mono text-foreground truncate">{filename ?? "output.json"}</span>
              <span className={cn(
                "ml-auto px-2 py-0.5 rounded-md font-medium",
                "bg-primary/15 text-primary"
              )}>
                JSON
              </span>
            </div>
            <div className="flex-1" style={{ minHeight: "60vh" }}>
              <JsonEditor value={jsonValue} onChange={setJsonValue} filename={filename} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
