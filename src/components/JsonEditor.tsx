import { useState, useCallback, useMemo } from "react";
import ReactJson from "react-json-view";
import { Copy, Check, Download, Braces, ListChecks, Upload, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import {questionService} from "../services/index"
import Loader from "./Loader";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename?: string;
}

const JsonEditor = ({ value, onChange }: JsonEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkAnswers, setBulkAnswers] = useState("");
  const [uploading, setUploading] = useState(false);

  const jsonObject = useMemo(() => {
    try {
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  }, [value]);

  const handleEdit = useCallback((edit: any) => {
    onChange(JSON.stringify(edit.updated_src, null, 2));
  }, [onChange]);

  // --- Bulk Answer Logic ---
  const applyBulkAnswers = () => {
    // Regex to find letters A-E, ignoring numbers and dots
    const answersArray = bulkAnswers.match(/[A-E]/gi) || [];
    
    if (answersArray.length === 0) return;

    // Clone the current object
    const newObj = JSON.parse(JSON.stringify(jsonObject));
    
    // Check if the JSON has a 'questions' array (standard for exam parsers)
    // or if the root itself is an array
    const targetArray = Array.isArray(newObj) ? newObj : newObj.questions;

    if (Array.isArray(targetArray)) {
      targetArray.forEach((q, index) => {
        if (answersArray[index]) {
          q.answer = answersArray[index].toUpperCase();
        }
      });
      
      onChange(JSON.stringify(newObj, null, 2));
      setBulkAnswers("");
      setShowBulkInput(false);
    } else {
      alert("Could not find a questions array in the JSON.");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpload = () => {
    setUploading(true);
    console.log("Uploading JSON to backend...", jsonObject.questions);
   questionService(jsonObject.questions, setUploading);
  }

  if(uploading) {
    return(
      <>
       <Loader />
      </>
    )
  }
  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border shadow-lg bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <button 
            onClick={() => setShowBulkInput(!showBulkInput)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors",
              showBulkInput ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <ListChecks className="w-3 h-3" />
            Bulk Answers
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary">
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={handleUpload} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary">
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </div>

      {/* Bulk Input Overlay */}
{showBulkInput && (
  <div className="bg-secondary/50 p-4 border-b border-border animate-in slide-in-from-top duration-200">
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
            Paste Answer Key (One answer per line)
          </label>
          <div className="flex items-center gap-2">
            <ListChecks className="w-3 h-3 text-primary/60" />
            <span className="text-[11px] font-medium text-foreground">
              {bulkAnswers ? (
                <>
                  First Answer Preview: <span className="text-primary italic">
                    "{bulkAnswers.split(/\n|;/).filter(a => a.trim() !== "")[0]}"
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Waiting for list of answers...</span>
              )}
            </span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          Count: {bulkAnswers.split(/\n|;/).filter(a => a.trim() !== "").length}
        </div>
      </div>
      
      <div className="flex gap-2">
        <textarea 
          autoFocus
          value={bulkAnswers}
          onChange={(e) => setBulkAnswers(e.target.value)}
          placeholder={"Photosynthesis\nRespiration\nCell Wall..."}
          className="flex-1 min-h-[80px] max-h-[150px] bg-background border border-border rounded-lg p-3 text-sm font-mono outline-none focus:ring-2 ring-primary/20 transition-all"
        />
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => {
              // Logic to split by New Line or Semicolon
              const answersArray = bulkAnswers
                .split(/\n|;/)
                .map(a => a.trim())
                .filter(a => a !== "");

              if (answersArray.length === 0) return;

              const newObj = JSON.parse(JSON.stringify(jsonObject));
              const targetArray = Array.isArray(newObj) ? newObj : newObj.questions;

              if (Array.isArray(targetArray)) {
                targetArray.forEach((q, index) => {
                  if (answersArray[index]) {
                    q.correctAnswer = answersArray[index];
                  }
                });
                onChange(JSON.stringify(newObj, null, 2));
                setBulkAnswers("");
                setShowBulkInput(false);
              }
            }}
            disabled={!bulkAnswers.trim()}
            className="flex-1 px-6 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 shadow-sm transition-all"
          >
            Apply Answers
          </button>
          <button 
            onClick={() => setBulkAnswers("")}
            className="px-2 py-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Editor Area */}
      <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e]">
        <ReactJson
          src={jsonObject}
          onEdit={handleEdit}
          onAdd={handleEdit}
          onDelete={handleEdit}
          theme="monokai"
          name={false}
          displayDataTypes={false}
          displayObjectSize={true}
          indentWidth={2}
          collapsed={1}
          style={{ backgroundColor: 'transparent', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}
        />
      </div>
    </div>
  );
};

export default JsonEditor;