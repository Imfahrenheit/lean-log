"use client";

import { useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, CheckCircle2, Pencil } from "lucide-react";
import type { MealEntry } from "@/lib/voice-schemas";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

type VoiceInputModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: (entries: MealEntry[]) => Promise<void>;
};

// Audio visualization component
function AudioVisualizer({
  audioLevel,
  isListening,
}: {
  audioLevel: number;
  isListening: boolean;
}) {
  const bars = 30;

  return (
    <div className="flex items-center justify-center gap-1 h-20 my-4">
      {Array.from({ length: bars }).map((_, i) => {
        // Create wave effect from center
        const distanceFromCenter = Math.abs(i - bars / 2) / (bars / 2);
        const baseHeight = isListening ? 8 + audioLevel * 60 : 4;
        const height = baseHeight * (1 - distanceFromCenter * 0.4);

        return (
          <div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-purple-500 transition-all duration-100"
            style={{
              height: `${height}px`,
              opacity: isListening ? 0.6 + audioLevel * 0.4 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

export function VoiceInputModal({
  open,
  onOpenChange,
  onCommit,
}: VoiceInputModalProps) {
  const [step, setStep] = useState<"record" | "confirm" | "edit">("record");
  const [editedTranscript, setEditedTranscript] = useState("");
  const [parsedEntries, setParsedEntries] = useState<MealEntry[]>([]);
  const [lastParsedText, setLastParsedText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MealEntry | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isCommitting, startCommitting] = useTransition();

  const {
    isSupported,
    isListening,
    transcript,
    error,
    audioLevel,
    startListening,
    stopListening,
    reset,
  } = useSpeechRecognition();

  const handleStartRecording = () => {
    reset();
    setParsedEntries([]);
    setLastParsedText("");
    setEditedTranscript("");
    setStep("record");
    startListening();
  };

  const handleTranscriptConfirm = () => {
    const textToUse = editedTranscript || transcript;
    if (!textToUse.trim()) {
      toast.error("No transcript to parse");
      return;
    }

    // Check if text hasn't changed since last parse
    if (textToUse === lastParsedText && parsedEntries.length > 0) {
      // Reuse cached results without calling AI
      setStep("confirm");
      return;
    }

    startParsing(async () => {
      try {
        const response = await fetch("/api/voice/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: textToUse }),
        });

        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || "Failed to parse");
        }

        setParsedEntries(result.data.entries);
        setLastParsedText(textToUse);
        setStep("confirm");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Parse failed");
      }
    });
  };

  const handleCommit = () => {
    startCommitting(async () => {
      try {
        await onCommit(parsedEntries);
        toast.success(
          `Added ${parsedEntries.length} meal ${
            parsedEntries.length === 1 ? "entry" : "entries"
          }`
        );
        handleClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  };

  const handleEditEntry = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...parsedEntries[index] });
    setStep("edit");
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editForm) {
      const updated = [...parsedEntries];
      updated[editingIndex] = editForm;
      setParsedEntries(updated);
      setEditingIndex(null);
      setEditForm(null);
      setStep("confirm");
    }
  };

  const handleDeleteEntry = (index: number) => {
    const updated = parsedEntries.filter((_, i) => i !== index);
    setParsedEntries(updated);
    if (updated.length === 0) {
      setStep("record");
    }
  };

  const handleClose = () => {
    reset();
    setEditedTranscript("");
    setParsedEntries([]);
    setLastParsedText("");
    setEditingIndex(null);
    setEditForm(null);
    setStep("record");
    onOpenChange(false);
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Speech Recognition Not Supported</DialogTitle>
            <DialogDescription>
              Your browser doesn&apos;t support voice input. Try Chrome, Edge, or
              Safari.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {step === "record" && "Voice Input"}
            {step === "confirm" && "Confirm Meal Entries"}
            {step === "edit" && "Edit Meal Entry"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {step === "record" && "Click the microphone to start recording"}
            {step === "confirm" && "Review and edit before saving"}
            {step === "edit" && "Modify the meal details as needed"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Recording */}
        {step === "record" && (
          <div className="space-y-4">
            {/* Audio Visualizer */}
            <AudioVisualizer audioLevel={audioLevel} isListening={isListening} />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex gap-3 sm:gap-4">
                <Button
                  size="lg"
                  variant={isListening ? "outline" : "default"}
                  onClick={handleStartRecording}
                  disabled={isListening || isParsing}
                  className="h-20 w-20 sm:h-16 sm:w-16 rounded-full touch-manipulation"
                  aria-label="Start recording"
                >
                  <Mic className="h-8 w-8 sm:h-7 sm:w-7" />
                </Button>

                {isListening && (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopListening}
                    className="h-20 w-20 sm:h-16 sm:w-16 rounded-full touch-manipulation"
                    aria-label="Stop recording"
                  >
                    <MicOff className="h-8 w-8 sm:h-7 sm:w-7" />
                  </Button>
                )}
              </div>

              <p className="text-sm sm:text-base text-muted-foreground text-center px-4">
                {isListening
                  ? "Listening... Speak naturally, pauses are OK"
                  : "Click microphone to start"}
              </p>
            </div>

            {/* Parsing Indicator */}
            {isParsing && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 border rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Parsing with AI...</p>
                  <p className="text-xs text-muted-foreground">
                    Analyzing your meal and estimating macros
                  </p>
                </div>
              </div>
            )}

            {transcript && !isParsing && (
              <div className="space-y-2">
                <Label htmlFor="transcript" className="text-sm sm:text-base">
                  Transcript
                </Label>
                <Textarea
                  id="transcript"
                  value={editedTranscript || transcript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  rows={4}
                  placeholder="Your speech will appear here..."
                  disabled={isParsing}
                  className="text-base resize-none"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  You can edit the transcript before parsing
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">Error: {error}</p>}
          </div>
        )}

        {/* Step 2: Confirm Parsed Data */}
        {step === "confirm" && (
          <div className="space-y-4">
            {parsedEntries.map((entry, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{entry.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      {Math.round(entry.confidence * 100)}% confident
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditEntry(index)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEntry(index)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <Label className="text-xs">Protein</Label>
                    <p>{entry.protein_g}g</p>
                  </div>
                  <div>
                    <Label className="text-xs">Carbs</Label>
                    <p>{entry.carbs_g}g</p>
                  </div>
                  <div>
                    <Label className="text-xs">Fat</Label>
                    <p>{entry.fat_g}g</p>
                  </div>
                  <div>
                    <Label className="text-xs">Calories</Label>
                    <p>
                      {entry.calories_override ??
                        Math.round(
                          entry.protein_g * 4 + entry.carbs_g * 4 + entry.fat_g * 9
                        )}
                    </p>
                  </div>
                </div>
                {entry.meal_type && (
                  <div className="text-xs text-muted-foreground">
                    Meal: {entry.meal_type}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Edit Entry */}
        {step === "edit" && editForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Food Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g., Chicken breast"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-protein">Protein (g)</Label>
                <Input
                  id="edit-protein"
                  type="number"
                  inputMode="numeric"
                  value={editForm.protein_g}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      protein_g: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-carbs">Carbs (g)</Label>
                <Input
                  id="edit-carbs"
                  type="number"
                  inputMode="numeric"
                  value={editForm.carbs_g}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      carbs_g: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fat">Fat (g)</Label>
                <Input
                  id="edit-fat"
                  type="number"
                  inputMode="numeric"
                  value={editForm.fat_g}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      fat_g: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-calories">Calories (optional)</Label>
                <Input
                  id="edit-calories"
                  type="number"
                  inputMode="numeric"
                  value={editForm.calories_override ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      calories_override: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Auto"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-meal-type">Meal Type (optional)</Label>
              <Input
                id="edit-meal-type"
                value={editForm.meal_type ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    meal_type: e.target.value || null,
                  })
                }
                placeholder="e.g., breakfast, lunch, meal-1"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === "record" && (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleTranscriptConfirm}
                disabled={!transcript || isParsing}
                className="w-full sm:w-auto"
              >
                {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Parse Transcript
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("record")} className="w-full sm:w-auto">
                Back
              </Button>
              <Button onClick={handleCommit} disabled={isCommitting} className="w-full sm:w-auto">
                {isCommitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save {parsedEntries.length}{" "}
                {parsedEntries.length === 1 ? "Entry" : "Entries"}
              </Button>
            </>
          )}

          {step === "edit" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingIndex(null);
                  setEditForm(null);
                  setStep("confirm");
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="w-full sm:w-auto">
                Save Changes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
