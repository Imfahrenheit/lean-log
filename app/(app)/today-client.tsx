"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  addMealEntry,
  deleteMealEntry,
  duplicateDay,
  reorderMealEntries,
  updateDayLog,
  updateMealEntry,
} from "./actions";
import {
  MacroTotals,
  MealEntryDTO,
  MealTemplate,
  TodayViewProps,
} from "./today.types";
import {
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
} from "@radix-ui/react-icons";
import { Mic } from "lucide-react";
import { VoiceInputModal } from "./components/voice-input-modal";
import type { MealEntry as VoiceMealEntry } from "@/lib/voice-schemas";

type EntryFormState = {
  id?: string;
  mealId: string | null;
  name: string;
  protein: string;
  carbs: string;
  fat: string;
  caloriesOverride: string;
};

type EntryModalState = {
  open: boolean;
  mealId: string | null;
  entry?: MealEntryDTO | null;
};

const UNASSIGNED_MEAL_ID = "__unassigned";

function computeTotals(entries: MealEntryDTO[]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (acc, entry) => {
      acc.calories += entry.total_calories ?? 0;
      acc.protein += entry.protein_g ?? 0;
      acc.carbs += entry.carbs_g ?? 0;
      acc.fat += entry.fat_g ?? 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function buildMealOrderMap(meals: MealTemplate[]): Map<string, number> {
  const map = new Map<string, number>();
  meals
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .forEach((meal, index) => {
      map.set(meal.id, index);
    });
  return map;
}

function sortEntries(
  list: MealEntryDTO[],
  mealOrder: Map<string, number>
): MealEntryDTO[] {
  return [...list].sort((a, b) => {
    const orderA = a.meal_id ? mealOrder.get(a.meal_id) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const orderB = b.meal_id ? mealOrder.get(b.meal_id) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });
}

function createEntryForm(
  mealId: string | null,
  entry?: MealEntryDTO | null
): EntryFormState {
  if (entry) {
    return {
      id: entry.id,
      mealId: entry.meal_id ?? null,
      name: entry.name ?? "",
      protein: String(entry.protein_g ?? 0),
      carbs: String(entry.carbs_g ?? 0),
      fat: String(entry.fat_g ?? 0),
      caloriesOverride:
        entry.calories_override != null ? String(entry.calories_override) : "",
    };
  }
  return {
    mealId,
    name: "",
    protein: "0",
    carbs: "0",
    fat: "0",
    caloriesOverride: "",
  };
}

function parseIntField(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed);
}

function parseOptionalIntField(value: string): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value ?? 0
  );
}

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export default function TodayClient({
  selectedDate,
  dayLog: incomingDayLog,
  meals: incomingMeals,
  entries: incomingEntries,
  summary,
  heightCm,
  latestWeightKg,
}: TodayViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const meals = useMemo(
    () => incomingMeals.slice().sort((a, b) => a.order_index - b.order_index),
    [incomingMeals]
  );
  const mealOrder = useMemo(() => buildMealOrderMap(meals), [meals]);

  const [entries, setEntries] = useState<MealEntryDTO[]>(
    sortEntries(incomingEntries, mealOrder)
  );
  const [dayLog, setDayLog] = useState(incomingDayLog);
  const [targetInput, setTargetInput] = useState(
    incomingDayLog.target_calories_override != null
      ? String(incomingDayLog.target_calories_override)
      : ""
  );
  const [notes, setNotes] = useState(incomingDayLog.notes ?? "");
  const [entryModal, setEntryModal] = useState<EntryModalState>({
    open: false,
    mealId: null,
    entry: null,
  });
  const [entryForm, setEntryForm] = useState<EntryFormState>(
    createEntryForm(null)
  );
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState<string>("");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const [isSavingEntry, startSavingEntry] = useTransition();
  const [isSavingTarget, startSavingTarget] = useTransition();
  const [isSavingNotes, startSavingNotes] = useTransition();
  const [isDuplicating, startDuplicating] = useTransition();

  useEffect(() => {
    setEntries(sortEntries(incomingEntries, mealOrder));
  }, [incomingEntries, mealOrder]);

  useEffect(() => {
    setDayLog(incomingDayLog);
    setTargetInput(
      incomingDayLog.target_calories_override != null
        ? String(incomingDayLog.target_calories_override)
        : ""
    );
    setNotes(incomingDayLog.notes ?? "");
  }, [incomingDayLog]);

  const totals = useMemo(() => computeTotals(entries), [entries]);
  const defaultTargetCalories = useMemo(() => {
    if (summary.profileTargetCalories != null) {
      return summary.profileTargetCalories;
    }
    return summary.targetMacros.calories > 0
      ? summary.targetMacros.calories
      : null;
  }, [summary.profileTargetCalories, summary.targetMacros.calories]);
  const effectiveTargetCalories = useMemo(() => {
    if (dayLog.target_calories_override != null) {
      return dayLog.target_calories_override;
    }
    return defaultTargetCalories;
  }, [dayLog.target_calories_override, defaultTargetCalories]);

  const caloriesProgress = useMemo(() => {
    if (!effectiveTargetCalories || effectiveTargetCalories <= 0) return 0;
    const ratio = (totals.calories / effectiveTargetCalories) * 100;
    return Math.min(Math.max(ratio, 0), 130);
  }, [effectiveTargetCalories, totals.calories]);

  const friendlyDate = useMemo(
    () => formatDateLabel(selectedDate),
    [selectedDate]
  );

  // Calculate BMI if both height and weight are available
  const bmi = useMemo(() => {
    if (!heightCm || heightCm <= 0 || !latestWeightKg || latestWeightKg <= 0) {
      return null;
    }
    const heightM = heightCm / 100;
    return latestWeightKg / (heightM * heightM);
  }, [heightCm, latestWeightKg]);

  const unassignedEntries = useMemo(
    () => entries.filter((entry) => entry.meal_id == null),
    [entries]
  );

  const entriesByMeal = useMemo(() => {
    const map = new Map<string, MealEntryDTO[]>();
    meals.forEach((meal) => {
      map.set(
        meal.id,
        entries.filter((entry) => entry.meal_id === meal.id)
      );
    });
    if (unassignedEntries.length > 0) {
      map.set(UNASSIGNED_MEAL_ID, unassignedEntries);
    }
    return map;
  }, [entries, meals, unassignedEntries]);

  function closeEntryModal() {
    setEntryModal((state) => ({ ...state, open: false }));
  }

  function openEntryModal(mealId: string | null, entry?: MealEntryDTO) {
    setEntryForm(createEntryForm(mealId, entry));
    setEntryModal({ open: true, mealId, entry: entry ?? null });
  }

  function handleDateChange(value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) {
      params.set("date", value);
    } else {
      params.delete("date");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleEntryFieldChange<K extends keyof EntryFormState>(
    key: K,
    value: EntryFormState[K]
  ) {
    setEntryForm((prev) => ({ ...prev, [key]: value }));
  }

  async function persistEntry() {
    const protein = parseIntField(entryForm.protein);
    const carbs = parseIntField(entryForm.carbs);
    const fat = parseIntField(entryForm.fat);
    const caloriesOverride = parseOptionalIntField(entryForm.caloriesOverride);
    const name = entryForm.name.trim();

    if (!name) {
      toast.error("Name is required");
      return;
    }

    startSavingEntry(async () => {
      try {
        if (entryForm.id) {
          await updateMealEntry(entryForm.id, {
            name,
            protein_g: protein,
            carbs_g: carbs,
            fat_g: fat,
            calories_override: caloriesOverride,
          });
          setEntries((prev) =>
            sortEntries(
              prev.map((entry) =>
                entry.id === entryForm.id
                  ? {
                      ...entry,
                      name,
                      protein_g: protein,
                      carbs_g: carbs,
                      fat_g: fat,
                      calories_override: caloriesOverride,
                      total_calories:
                        caloriesOverride ?? protein * 4 + carbs * 4 + fat * 9,
                    }
                  : entry
              ),
              mealOrder
            )
          );
          toast.success("Entry updated");
        } else {
          const created = await addMealEntry({
            dayLogId: dayLog.id,
            mealId: entryForm.mealId ?? null,
            name,
            protein_g: protein,
            carbs_g: carbs,
            fat_g: fat,
            calories_override: caloriesOverride,
          });
          setEntries((prev) => sortEntries([...prev, created], mealOrder));
          toast.success("Entry added");
        }
        closeEntryModal();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to save entry"));
      }
    });
  }

  function handleDeleteEntry(entry: MealEntryDTO) {
    const previous = entries;
    setEntries((prev) => prev.filter((item) => item.id !== entry.id));
    deleteMealEntry(entry.id)
      .then(() => {
        toast.success("Entry deleted");
      })
      .catch((error: unknown) => {
        setEntries(previous);
        toast.error(getErrorMessage(error, "Failed to delete entry"));
      });
  }

  function handleReorder(mealId: string | null, ordered: MealEntryDTO[]) {
    const ids = ordered.map((entry) => entry.id);
    const previous = entries;
    setEntries((prev) =>
      sortEntries(
        prev.map((entry) => {
          const index = ids.indexOf(entry.id);
          if (entry.meal_id === mealId && index !== -1) {
            return { ...entry, order_index: index };
          }
          return entry;
        }),
        mealOrder
      )
    );

    reorderMealEntries(dayLog.id, mealId, ids).catch((error: unknown) => {
      setEntries(previous);
      toast.error(getErrorMessage(error, "Failed to reorder entries"));
    });
  }

  function handleTargetSave(nextValue?: string) {
    const parsed = parseOptionalIntField(
      nextValue !== undefined ? nextValue : targetInput
    );
    startSavingTarget(async () => {
      try {
        await updateDayLog(dayLog.id, {
          target_calories_override: parsed,
        });
        setDayLog((prev) => ({ ...prev, target_calories_override: parsed }));
        toast.success("Target updated");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to update target"));
      }
    });
  }

  function handleNotesSave() {
    startSavingNotes(async () => {
      try {
        const trimmed = notes.trim();
        await updateDayLog(dayLog.id, {
          notes: trimmed.length ? trimmed : null,
        });
        setDayLog((prev) => ({ ...prev, notes: trimmed.length ? trimmed : null }));
        toast.success("Notes saved");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to save notes"));
      }
    });
  }

  function handleDuplicateDay() {
    if (!duplicateDate) {
      toast.error("Select a date to copy from");
      return;
    }
    if (duplicateDate === dayLog.log_date) {
      toast.error("Cannot duplicate the same day");
      return;
    }
    startDuplicating(async () => {
      try {
        await duplicateDay(duplicateDate, dayLog.log_date);
        toast.success("Day duplicated");
        setDuplicateOpen(false);
        setDuplicateDate("");
        router.refresh();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to duplicate day"));
      }
    });
  }

  async function handleVoiceCommit(entries: VoiceMealEntry[]) {
    const previous = incomingEntries;
    try {
      for (const entry of entries) {
        const created = await addMealEntry({
          dayLogId: dayLog.id,
          mealId: null,
          name: entry.name,
          protein_g: entry.protein_g,
          carbs_g: entry.carbs_g,
          fat_g: entry.fat_g,
          calories_override: entry.calories_override ?? null,
        });
        setEntries((prev) => sortEntries([...prev, created], mealOrder));
      }
    } catch (error: unknown) {
      setEntries(previous);
      toast.error(getErrorMessage(error, "Failed to save voice entries"));
      throw error;
    }
  }

  const remainingCalories = effectiveTargetCalories
    ? effectiveTargetCalories - totals.calories
    : null;

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Today</h2>
          <p className="text-sm text-muted-foreground">{friendlyDate}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => handleDateChange(event.target.value)}
            className="h-10"
          />
          <Button
            variant="outline"
            onClick={() => setVoiceModalOpen(true)}
            className="h-10"
          >
            <Mic className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Voice</span>
          </Button>
          <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10">
                <CopyIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Duplicate</span>
                <span className="sm:hidden">Copy Day</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Duplicate from another day</DialogTitle>
                <DialogDescription>
                  Copy all meal entries, notes, and calorie target into this day.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="duplicate-date">Source date</Label>
                <Input
                  id="duplicate-date"
                  type="date"
                  value={duplicateDate}
                  max={(() => {
                    // Convert selectedDate (YYYY-MM-DD, possibly UTC) to local date string
                    const d = new Date(selectedDate + 'T00:00:00');
                    const offset = d.getTimezoneOffset();
                    const local = new Date(d.getTime() - offset * 60000);
                    return local.toISOString().slice(0, 10);
                  })()}
                  onChange={(event) => setDuplicateDate(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Entries and notes from the selected date will replace this day.
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleDuplicateDay}
                  disabled={!duplicateDate || isDuplicating}
                >
                  {isDuplicating ? "Duplicating..." : "Copy entries"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Calories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{formatNumber(totals.calories)} kcal</span>
              {effectiveTargetCalories ? (
                <span className="text-muted-foreground">
                  Target {formatNumber(effectiveTargetCalories)}
                </span>
              ) : (
                <span className="text-muted-foreground">No target set</span>
              )}
            </div>
            <Progress value={caloriesProgress} />
            {effectiveTargetCalories != null && (
              <div
                className={cn(
                  "text-xs",
                  remainingCalories != null && remainingCalories < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {remainingCalories != null && remainingCalories < 0
                  ? `${formatNumber(Math.abs(remainingCalories))} kcal over`
                  : `${formatNumber(remainingCalories ?? 0)} kcal remaining`}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <MacroRow
              label="Protein"
              consumed={totals.protein}
              target={summary.targetMacros.protein}
            />
            <MacroRow
              label="Carbs"
              consumed={totals.carbs}
              target={summary.targetMacros.carbs}
            />
            <MacroRow
              label="Fat"
              consumed={totals.fat}
              target={summary.targetMacros.fat}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weight & BMI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestWeightKg && heightCm ? (
              <>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {latestWeightKg.toFixed(1)} kg
                  </div>
                  {bmi && (
                    <div className="text-sm text-muted-foreground">
                      BMI: <span className="font-medium">{bmi.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <Link href="/weight">
                  <Button variant="outline" size="sm" className="w-full">
                    Track Weight
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {!heightCm && !latestWeightKg
                    ? "Set height and log weight to track BMI"
                    : !heightCm
                    ? "Set your height in profile to calculate BMI"
                    : "Log your weight to see BMI"}
                </p>
                <Link href={!heightCm ? "/profile" : "/weight"}>
                  <Button variant="outline" size="sm" className="w-full">
                    {!heightCm ? "Set Height" : "Log Weight"}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily target override</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="target-calories">Calories</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="target-calories"
                  type="number"
                  inputMode="numeric"
                  placeholder={
                    summary.profileTargetCalories
                      ? String(summary.profileTargetCalories)
                      : undefined
                  }
                  value={targetInput}
                  onChange={(event) => setTargetInput(event.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTargetInput("");
                    handleTargetSave("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
            <Button onClick={() => handleTargetSave()} disabled={isSavingTarget}>
              {isSavingTarget ? "Saving..." : "Save target"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={5}
              value={notes}
              placeholder="How did today go?"
              onChange={(event) => setNotes(event.target.value)}
            />
            <Button onClick={handleNotesSave} disabled={isSavingNotes}>
              {isSavingNotes ? "Saving..." : "Save notes"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3 sm:space-y-5">
        {meals.length === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Create your meals in Settings → Meals to start tracking.
            </CardContent>
          </Card>
        )}

        {meals.map((meal) => {
          const mealEntries = entriesByMeal.get(meal.id) ?? [];
          return (
            <MealCard
              key={meal.id}
              meal={meal}
              entries={mealEntries}
              onAdd={() => openEntryModal(meal.id)}
              onEdit={(entry) => openEntryModal(meal.id, entry)}
              onDelete={handleDeleteEntry}
              onReorder={(ordered) => handleReorder(meal.id, ordered)}
            />
          );
        })}

        {unassignedEntries.length > 0 || meals.length === 0 ? (
          <MealCard
            key={UNASSIGNED_MEAL_ID}
            meal={{
              id: UNASSIGNED_MEAL_ID,
              name: "Quick add",
              order_index: meals.length + 1,
              target_protein_g: null,
              target_carbs_g: null,
              target_fat_g: null,
              target_calories: null,
            }}
            entries={unassignedEntries}
            onAdd={() => openEntryModal(null)}
            onEdit={(entry) => openEntryModal(null, entry)}
            onDelete={handleDeleteEntry}
            onReorder={(ordered) => handleReorder(null, ordered)}
          />
        ) : (
          <Button variant="ghost" onClick={() => openEntryModal(null)}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add quick entry
          </Button>
        )}
      </section>

      <EntryDialog
        open={entryModal.open}
        onOpenChange={(open) => {
          if (!open) closeEntryModal();
          else setEntryModal((prev) => ({ ...prev, open }));
        }}
        form={entryForm}
        onChange={handleEntryFieldChange}
        onClose={closeEntryModal}
        onSubmit={persistEntry}
        saving={isSavingEntry}
      />

      <VoiceInputModal
        open={voiceModalOpen}
        onOpenChange={setVoiceModalOpen}
        onCommit={handleVoiceCommit}
      />
    </div>
  );
}

function MacroRow({
  label,
  consumed,
  target,
}: {
  label: string;
  consumed: number;
  target: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-muted-foreground">
        {formatNumber(consumed)}
        {target != null ? ` / ${formatNumber(target)}` : ""} g
      </span>
    </div>
  );
}

type MealCardProps = {
  meal: MealTemplate;
  entries: MealEntryDTO[];
  onAdd: () => void;
  onEdit: (entry: MealEntryDTO) => void;
  onDelete: (entry: MealEntryDTO) => void;
  onReorder: (ordered: MealEntryDTO[]) => void;
};

function MealCard({ meal, entries, onAdd, onEdit, onDelete, onReorder }: MealCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((entry) => entry.id === active.id);
    const newIndex = entries.findIndex((entry) => entry.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base sm:text-lg">{meal.name}</CardTitle>
        <Button size="sm" onClick={onAdd} className="h-9">
          <PlusIcon className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add entry</span>
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No entries yet.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((entry) => entry.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {entries.map((entry) => (
                  <SortableEntry
                    key={entry.id}
                    entry={entry}
                    onEdit={() => onEdit(entry)}
                    onDelete={() => onDelete(entry)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

function SortableEntry({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MealEntryDTO;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-border rounded-md p-3 sm:p-4 bg-card flex items-center justify-between gap-2 sm:gap-3 min-h-[60px]",
        isDragging && "opacity-80 shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{entry.name}</div>
        <div className="text-xs text-muted-foreground">
          P {formatNumber(entry.protein_g)} / C {formatNumber(entry.carbs_g)} / F {formatNumber(entry.fat_g)}
          {" · "}
          {formatNumber(entry.total_calories ?? 0)} kcal
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-9 w-9">
          <Pencil1Icon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive h-9 w-9"
          onClick={onDelete}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EntryDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
  onClose,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EntryFormState;
  onChange: <K extends keyof EntryFormState>(key: K, value: EntryFormState[K]) => void;
  onSubmit: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const title = form.id ? "Edit entry" : "Add entry";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="entry-name">Name</Label>
            <Input
              id="entry-name"
              value={form.name}
              autoFocus
              onChange={(event) => onChange("name", event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField
              label="Protein (g)"
              value={form.protein}
              onChange={(value) => onChange("protein", value)}
            />
            <NumberField
              label="Carbs (g)"
              value={form.carbs}
              onChange={(value) => onChange("carbs", value)}
            />
            <NumberField
              label="Fat (g)"
              value={form.fat}
              onChange={(value) => onChange("fat", value)}
            />
          </div>
          <NumberField
            label="Calories override"
            value={form.caloriesOverride}
            onChange={(value) => onChange("caloriesOverride", value)}
            placeholder="Auto"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
