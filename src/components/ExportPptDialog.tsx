// src/components/ExportPptDialog.tsx
import { useEffect, useState } from "react";
import { Presentation, FileText, CheckCircle2 } from "lucide-react";

type ExportDialogProps = {
  open: boolean;
  exportType: "ppt" | "word";
  requestName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

const EXPORT_STEPS = {
  ppt: [
    "Gathering analytical data...",
    "Applying C5i corporate branding...",
    "Formatting native slides and charts...",
    "Finalizing executive presentation...",
  ],
  word: [
    "Gathering analytical data...",
    "Structuring document layout...",
    "Formatting tables and text...",
    "Finalizing executive report...",
  ]
};

export default function ExportPptDialog({
  open,
  exportType,
  requestName,
  onClose,
  onConfirm,
}: ExportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = EXPORT_STEPS[exportType] || EXPORT_STEPS.ppt;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsGenerating(false);
      setIsSuccess(false);
      setProgress(0);
      setStepIndex(0);
    }
  }, [open]);

  // Handle the fake progress and rotating text while waiting for the backend
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let textInterval: NodeJS.Timeout;

    if (isGenerating && !isSuccess) {
      // 1. Slowly creep the progress bar up to 90%
      progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 15));
      }, 600);

      // 2. Rotate the loading text every 2 seconds
      textInterval = setInterval(() => {
        setStepIndex((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
      }, 2000);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, [isGenerating, isSuccess, steps.length]);

  if (!open) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Run BOTH the export function and a strict 4-second timer simultaneously.
      // This guarantees the animation plays for at least 4 seconds for a premium UX feel.
      await Promise.all([
        onConfirm(),
        new Promise((resolve) => setTimeout(resolve, 4000))
      ]);
      
      setProgress(100);
      setIsSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (error) {
      console.error("Export failed:", error);
      setIsGenerating(false);
      onClose();
    }
  };

  const isWord = exportType === "word";
  
  // Dynamic styling based on export type
  const theme = {
    iconBg: isWord ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600",
    buttonBg: isWord ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-orange-600 hover:bg-orange-700 shadow-orange-200",
    pulseRing: isWord ? "bg-blue-400/40" : "bg-orange-400/40",
    progressFill: isWord ? "bg-blue-600" : "bg-orange-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
        
        {/* --- STATE 1: CONFIRMATION PROMPT --- */}
        {!isGenerating && !isSuccess && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${theme.iconBg}`}>
              {isWord ? <FileText className="h-6 w-6" /> : <Presentation className="h-6 w-6" />}
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              Export {isWord ? "Word Document" : "PowerPoint"}
            </h3>
            <p className="mb-6 text-sm leading-6 text-slate-500">
              Generate native, branded documentation for <span className="font-medium text-slate-900">{requestName}</span>.
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition ${theme.buttonBg}`}
              >
                Start Export
              </button>
            </div>
          </div>
        )}

        {/* --- STATE 2: GENERATING ANIMATION --- */}
        {isGenerating && !isSuccess && (
          <div className="py-6 text-center animate-in fade-in zoom-in-95 duration-300">
            
            {/* Animated Logo with Satisfying Pulse */}
            <div className="mx-auto mb-8 flex items-center justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center">
                {/* The expanding ripple effect */}
                <span className={`absolute inset-0 animate-ping rounded-full duration-1000 ${theme.pulseRing}`} />
                {/* The actual App Icon */}
                <img 
                  src={isWord ? "../../src/assets/Microsoft_Office_Word.png" : "../../src/assets/Microsoft_Office_PowerPoint.png"} 
                  alt={isWord ? "Word" : "PowerPoint"} 
                  className="relative z-10 h-16 w-16" 
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Building your export</h3>
              <p className="mt-1 h-5 text-sm text-slate-500 transition-opacity duration-300">
                {steps[stepIndex]}
              </p>
            </div>

            {/* Smooth Progress Bar */}
            <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${theme.progressFill}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* --- STATE 3: SUCCESS ANIMATION --- */}
        {isSuccess && (
          <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Export Complete!</h3>
            <p className="mt-2 text-sm text-slate-500">Your document is downloading.</p>
          </div>
        )}

      </div>
    </div>
  );
}