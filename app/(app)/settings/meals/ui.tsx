"use client";

import { useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createMeal, updateMeal, deleteMeal, reorderMeals } from "./actions";

type Meal = {
  id: string;
  name: string;
  order_index: number;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_calories: number | null;
  archived: boolean | null;
};

export default function MealsClient({
  initialMeals,
}: {
  initialMeals: Meal[];
}) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Meal>>({ name: "" });
  const isEdit = Boolean(form?.id);

  async function handleSave() {
    try {
      if (!form.name) return toast.error("Name is required");
      if (isEdit && form.id) {
        setMeals((prev) =>
          prev.map((m) => (m.id === form.id ? ({ ...m, ...form } as Meal) : m))
        );
        await updateMeal(form.id, {
          name: form.name!,
          target_protein_g: numOrNull(form.target_protein_g),
          target_carbs_g: numOrNull(form.target_carbs_g),
          target_fat_g: numOrNull(form.target_fat_g),
          target_calories: numOrNull(form.target_calories),
        });
        toast.success("Meal updated");
      } else {
        const optimistic: Meal = {
          id: `temp-${Date.now()}`,
          name: form.name!,
          order_index: meals.length,
          target_protein_g: numOrNull(form.target_protein_g),
          target_carbs_g: numOrNull(form.target_carbs_g),
          target_fat_g: numOrNull(form.target_fat_g),
          target_calories: numOrNull(form.target_calories),
          archived: false,
        } as Meal;
        setMeals((prev) => [...prev, optimistic]);
        const created = await createMeal({
          name: optimistic.name,
          target_protein_g: optimistic.target_protein_g ?? undefined,
          target_carbs_g: optimistic.target_carbs_g ?? undefined,
          target_fat_g: optimistic.target_fat_g ?? undefined,
          target_calories: optimistic.target_calories ?? undefined,
        });
        setMeals((prev) =>
          prev.map((m) => (m.id === optimistic.id ? (created as Meal) : m))
        );
        toast.success("Meal created");
      }
      setOpen(false);
      setForm({ name: "" });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save"));
    }
  }

  async function handleDelete(id: string) {
    const previous = meals;
    setMeals((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMeal(id);
      toast.success("Deleted");
    } catch (error: unknown) {
      setMeals(previous);
      toast.error(getErrorMessage(error, "Failed to delete"));
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = meals.findIndex((m) => m.id === active.id);
    const newIndex = meals.findIndex((m) => m.id === over.id);
    const newList = arrayMove(meals, oldIndex, newIndex).map((m, idx) => ({
      ...m,
      order_index: idx,
    }));
    setMeals(newList);
    reorderMeals(newList.map((m) => m.id)).catch(() =>
      toast.error("Failed to reorder")
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meals</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({ name: "" })}>New Meal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Meal" : "New Meal"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={numOrEmpty(form.target_protein_g)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_protein_g: toNum(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={numOrEmpty(form.target_carbs_g)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_carbs_g: toNum(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={numOrEmpty(form.target_fat_g)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_fat_g: toNum(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Target Calories</Label>
                <Input
                  type="number"
                  value={numOrEmpty(form.target_calories)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_calories: toNum(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={meals.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {meals.map((m) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      P{m.target_protein_g ?? 0} / C{m.target_carbs_g ?? 0} / F
                      {m.target_fat_g ?? 0} · {m.target_calories ?? 0} kcal
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setForm(m);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function toNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function numOrEmpty(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}

function numOrNull(n: number | null | undefined): number | null {
  return n == null ? null : n;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
