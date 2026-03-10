import { useState, useCallback } from "react";
import { FileText, FileJson, Loader2, X, ChevronRight, Braces, Settings2 } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import JsonEditor from "@/components/JsonEditor";
import { parseExamPDF } from '../services/pdftojson'
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Mode = "idle" | "loading" | "editor";

const Index = () => {
  const [mode, setMode] = useState<Mode>("idle");
  const [jsonValue, setJsonValue] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  
  // Metadata State
  const [metadata, setMetadata] = useState({
    examType: "JAMB",
    subject: "",
    imageUrl: "",
    examYear: new Date().getFullYear(),
  });

  const handlePdf = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF file.");
      return;
    }
    if (!metadata.subject) {
      setError("Please enter a subject before uploading.");
      return;
    }

    setError(null);
    setMode("loading");
    setFilename(file.name);
    setProgress("Parsing PDF...");
    
    try {
      // Use the live metadata from state
      const data = await parseExamPDF(file, metadata);
      setProgress("Formatting JSON...");
      setJsonValue(JSON.stringify(data, null, 2));
      setMode("editor");
    } catch (e) {
      setError(`Failed to parse PDF: ${(e as Error).message}`);
      setMode("idle");
    }
  }, [metadata]);

  const handleReset = () => {
    setMode("idle");
    setJsonValue("");
    setFilename(undefined);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg gradient-amber">
              <Braces className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
            <Link to={'/questions'} className="text-white underline">Manage Questions</Link>
            </span>
          </div>
          {mode === "editor" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-3.5 h-3.5" />
              New conversion
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8 gap-6">
        {/* {mode === "idle" && (
          <div className="flex flex-col items-center text-center gap-2 pt-6 pb-2 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight">
              Convert PDF to <span className="text-gradient-amber">Exam JSON</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Fill in the exam details and upload your PDF to generate a structured question bank.
            </p>
          </div>
        )} */}

        {mode === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-slide-up">
            {/* Metadata Section */}
            <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exam Metadata</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Exam Type</label>
                  <select 
                    value={metadata.examType}
                    onChange={(e) => setMetadata({...metadata, examType: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none"
                  >
                    <option value="JAMB">JAMB</option>
                    <option value="WAEC">WAEC</option>
                    <option value="NECO">NECO</option>
                    <option value="POST-UTME">POST-UTME</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Subject</label>
                  <input 
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={metadata.subject}
                    onChange={(e) => setMetadata({...metadata, subject: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Year</label>
                  <input 
                    type="number"
                    value={metadata.examYear}
                    onChange={(e) => setMetadata({...metadata, examYear: parseInt(e.target.value)})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="md:col-span-3">
              <UploadZone
                accept=".pdf"
                label="Upload Exam PDF"
                description="The metadata on the left will be attached to this file"
                icon="pdf"
                onFile={handlePdf}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm animate-fade-in">
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading State */}
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
            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border text-xs">
              <FileJson className="w-4 h-4 text-primary shrink-0" />
              <span className="font-mono text-foreground truncate">{filename ?? "output.json"}</span>
              <span className="ml-auto px-2 py-0.5 rounded-md font-medium bg-primary/15 text-primary">
                {metadata.examType} - {metadata.subject}
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
