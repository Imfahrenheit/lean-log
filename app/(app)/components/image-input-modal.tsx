"use client";

import { useState, useTransition, useRef } from "react";
import { createWorker } from "tesseract.js";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Pencil, Upload, Image as ImageIcon, X } from "lucide-react";
import type { MealEntry } from "@/lib/voice-schemas";
import { cn } from "@/lib/utils";

type ImageInputModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: (entries: MealEntry[]) => Promise<void>;
};

export function ImageInputModal({
  open,
  onOpenChange,
  onCommit,
}: ImageInputModalProps) {
  const [step, setStep] = useState<"upload" | "confirm" | "edit">("upload");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsedEntries, setParsedEntries] = useState<MealEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MealEntry | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isCommitting, startCommitting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleParse = () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    startParsing(async () => {
      try {
        // Step 1: Extract text from image using Tesseract.js (client-side OCR)
        toast.info("Extracting text from image...");
        const worker = await createWorker("eng");
        const {
          data: { text },
        } = await worker.recognize(selectedImage);
        await worker.terminate();

        const extractedText = text.trim();
        if (!extractedText) {
          throw new Error(
            "Could not extract text from image. Please ensure the image contains clear text."
          );
        }

        // Step 2: Parse the extracted text using the same endpoint as voice input
        toast.info("Parsing nutritional information...");
        const response = await fetch("/api/voice/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: extractedText }),
        });

        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || "Failed to parse nutritional data");
        }

        setParsedEntries(result.data.entries);
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
      setStep("upload");
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setParsedEntries([]);
    setEditingIndex(null);
    setEditForm(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {step === "upload" && "Upload Image"}
            {step === "confirm" && "Confirm Meal Entries"}
            {step === "edit" && "Edit Meal Entry"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {step === "upload" &&
              "Upload a screenshot or image with nutritional information"}
            {step === "confirm" && "Review and edit before saving"}
            {step === "edit" && "Modify the meal details as needed"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Quick Tips */}
            {!selectedImage && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  💡 Tips for best results:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Clear screenshots:</strong> Upload clear screenshots from ChatGPT or other nutrition apps
                  </li>
                  <li>
                    <strong>Include macros:</strong> Images with calories, protein, carbs, and fat work best
                  </li>
                  <li>
                    <strong>Single meal per image:</strong> For best accuracy, upload one meal summary at a time
                  </li>
                  <li>
                    <strong>Edit if needed:</strong> Check and fix entries before saving
                  </li>
                </ul>
              </div>
            )}

            {/* Image Upload Area */}
            {!selectedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview || ""}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose Different Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Parsing Indicator */}
            {isParsing && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 border rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Processing image...</p>
                  <p className="text-xs text-muted-foreground">
                    Extracting text and parsing nutritional information
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Confirm Parsed Data */}
        {step === "confirm" && (
          <div className="space-y-4">
            {parsedEntries.map((entry, index) => {
              const isLowConfidence = entry.confidence < 0.5;
              const needsUserInput =
                entry.protein_g === 0 &&
                entry.carbs_g === 0 &&
                entry.fat_g === 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-4 space-y-3",
                    (isLowConfidence || needsUserInput) &&
                      "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{entry.name}</h4>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isLowConfidence
                            ? "text-yellow-600 dark:text-yellow-500"
                            : "text-muted-foreground"
                        )}
                      >
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

                  {needsUserInput && (
                    <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                      ⚠️ Please click edit to add accurate macros
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <Label className="text-xs">Protein</Label>
                      <p className={needsUserInput ? "text-muted-foreground" : ""}>
                        {entry.protein_g}g
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Carbs</Label>
                      <p className={needsUserInput ? "text-muted-foreground" : ""}>
                        {entry.carbs_g}g
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Fat</Label>
                      <p className={needsUserInput ? "text-muted-foreground" : ""}>
                        {entry.fat_g}g
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Calories</Label>
                      <p className={needsUserInput ? "text-muted-foreground" : ""}>
                        {entry.calories_override ??
                          Math.round(
                            entry.protein_g * 4 +
                              entry.carbs_g * 4 +
                              entry.fat_g * 9
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
              );
            })}
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
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
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
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={!selectedImage || isParsing}
                className="w-full sm:w-auto"
              >
                {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Parse Image
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                onClick={handleCommit}
                disabled={isCommitting}
                className="w-full sm:w-auto"
              >
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

