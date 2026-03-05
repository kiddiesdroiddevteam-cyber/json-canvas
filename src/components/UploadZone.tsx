import { useRef, useState } from "react";
import { Upload, FileText, FileJson, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  accept: string;
  label: string;
  description: string;
  icon: "pdf" | "json";
  onFile: (file: File) => void;
  disabled?: boolean;
}

const UploadZone = ({ accept, label, description, icon, onFile, disabled }: UploadZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  const Icon = icon === "pdf" ? FileText : FileJson;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer group",
        "bg-card hover:bg-secondary",
        dragging
          ? "border-primary shadow-glow scale-[1.01]"
          : "border-border hover:border-primary/60",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
        "bg-muted group-hover:bg-primary/10",
        dragging && "bg-primary/15"
      )}>
        <Icon className={cn(
          "w-6 h-6 transition-colors duration-200",
          "text-muted-foreground group-hover:text-primary",
          dragging && "text-primary"
        )} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200",
        "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground",
        dragging && "bg-primary text-primary-foreground"
      )}>
        <Upload className="w-3 h-3" />
        Browse or drop
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
};

export default UploadZone;
