"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { machines } from "@/lib/machines-seed";
import type { ExerciseEntry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";

type ExerciseRowProps = {
  entry: ExerciseEntry;
  onChange: (updated: ExerciseEntry) => void;
  onRemove: () => void;
};

export function ExerciseRow({ entry, onChange, onRemove }: ExerciseRowProps) {
  const { t } = useLanguage();
  const machine = machines.find((m) => m.id === entry.machineId);
  const isFreeWeight = entry.weight.kind === "freeWeight";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start">
      <div className="flex shrink-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
          {entry.seq}
        </div>
        {machine && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {machine.thumbnailUrl ? (
              <Image src={encodeURI(machine.thumbnailUrl)} alt={machine.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                {machine.name.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <p className="text-sm font-semibold">{machine?.name ?? t("exercise.unknown")}</p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <Label className="text-xs text-muted-foreground">{t("exercise.sets")}</Label>
            <Input
              type="number"
              min={1}
              value={entry.sets}
              onChange={(e) => onChange({ ...entry, sets: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("exercise.reps")}</Label>
            <Input
              type="number"
              min={1}
              value={entry.reps}
              onChange={(e) => onChange({ ...entry, reps: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("exercise.technique")}</Label>
            <Input
              value={entry.technique}
              placeholder={t("exercise.techniquePlaceholder")}
              onChange={(e) => onChange({ ...entry, technique: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("exercise.rest")}</Label>
            <Input
              type="number"
              min={0}
              value={entry.restSeconds}
              onChange={(e) => onChange({ ...entry, restSeconds: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Switch
              checked={isFreeWeight}
              onCheckedChange={(checked) =>
                onChange({
                  ...entry,
                  weight: checked
                    ? { kind: "freeWeight" }
                    : { kind: "value", amount: 150, unit: "lb" },
                })
              }
            />
            <Label className="text-xs">{t("exercise.freeWeight")}</Label>
          </div>

          {!isFreeWeight && entry.weight.kind === "value" && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                className="w-24"
                value={entry.weight.amount}
                onChange={(e) =>
                  onChange({
                    ...entry,
                    weight: { kind: "value", amount: Number(e.target.value), unit: (entry.weight as { unit: "kg" | "lb" }).unit },
                  })
                }
              />
              <Select
                value={entry.weight.unit}
                onValueChange={(unit) =>
                  onChange({ ...entry, weight: { kind: "value", amount: (entry.weight as { amount: number }).amount, unit: unit as "kg" | "lb" } })
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0 self-start" aria-label={t("exercise.remove")}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
