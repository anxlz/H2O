"use client";

import { useState } from "react";
import type { ExerciseEntry, Machine, MuscleGroup, Program, ProgramDay } from "@/lib/types";
import { emptyWeight } from "@/lib/types";
import { MachinePicker } from "@/components/machine-picker";
import { ExerciseRow } from "@/components/exercise-row";
import { CardioForm } from "@/components/cardio-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";

function newDay(dayNumber: number): ProgramDay {
  return { dayNumber, label: "Push", isRestDay: false, groups: [] };
}

function defaultProgram(): Program {
  return {
    memberName: "",
    trainerName: "",
    days: [newDay(1)],
    cardio: { type: "Treadmill", warmupMinutes: 10, postWorkoutMinutes: 20, restBetweenSetsMinutes: 1 },
  };
}

export default function BuilderPage() {
  const { t } = useLanguage();
  const [program, setProgram] = useState<Program>(defaultProgram());
  const [activeDay, setActiveDay] = useState("1");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(dayNumber: number, updater: (day: ProgramDay) => ProgramDay) {
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) => (d.dayNumber === dayNumber ? updater(d) : d)),
    }));
  }

  function addDay() {
    const nextNumber = program.days.length + 1;
    setProgram((p) => ({ ...p, days: [...p.days, newDay(nextNumber)] }));
    setActiveDay(String(nextNumber));
  }

  function removeDay(dayNumber: number) {
    setProgram((p) => ({
      ...p,
      days: p.days.filter((d) => d.dayNumber !== dayNumber).map((d, i) => ({ ...d, dayNumber: i + 1 })),
    }));
    setActiveDay("1");
  }

  function addExercise(dayNumber: number, machine: Machine) {
    if (machine.category === "Cardio") return;
    const muscleGroup: MuscleGroup = machine.category;
    updateDay(dayNumber, (day) => {
      const groups = [...day.groups];
      const existing = groups.find((g) => g.muscleGroup === muscleGroup);
      const entry: ExerciseEntry = {
        id: `${machine.id}-${Date.now()}`,
        machineId: machine.id,
        seq: (existing?.exercises.length ?? 0) + 1,
        sets: 3,
        reps: 15,
        weight: emptyWeight(),
        technique: "1-0-1",
        restSeconds: 60,
      };
      if (existing) {
        return {
          ...day,
          groups: groups.map((g) =>
            g.muscleGroup === muscleGroup ? { ...g, exercises: [...g.exercises, entry] } : g
          ),
        };
      }
      return { ...day, groups: [...groups, { muscleGroup, exercises: [entry] }] };
    });
  }

  function updateExercise(dayNumber: number, muscleGroup: MuscleGroup, updated: ExerciseEntry) {
    updateDay(dayNumber, (day) => ({
      ...day,
      groups: day.groups.map((g) =>
        g.muscleGroup === muscleGroup
          ? { ...g, exercises: g.exercises.map((e) => (e.id === updated.id ? updated : e)) }
          : g
      ),
    }));
  }

  function removeExercise(dayNumber: number, muscleGroup: MuscleGroup, id: string) {
    updateDay(dayNumber, (day) => ({
      ...day,
      groups: day.groups
        .map((g) =>
          g.muscleGroup === muscleGroup
            ? { ...g, exercises: g.exercises.filter((e) => e.id !== id).map((e, i) => ({ ...e, seq: i + 1 })) }
            : g
        )
        .filter((g) => g.exercises.length > 0),
    }));
  }

  async function generatePdf() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${program.memberName || "program"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("member.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">{t("member.name")}</Label>
            <Input
              value={program.memberName}
              onChange={(e) => setProgram((p) => ({ ...p, memberName: e.target.value }))}
              placeholder={t("member.namePlaceholder")}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("trainer.name")}</Label>
            <Input
              value={program.trainerName}
              onChange={(e) => setProgram((p) => ({ ...p, trainerName: e.target.value }))}
              placeholder={t("trainer.namePlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeDay} onValueChange={setActiveDay}>
        <div className="flex items-center gap-2">
          <TabsList>
            {program.days.map((d) => (
              <TabsTrigger key={d.dayNumber} value={String(d.dayNumber)}>
                {t("day.prefix")} {d.dayNumber}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="outline" size="sm" onClick={addDay}>
            {t("day.add")}
          </Button>
        </div>

        {program.days.map((day) => (
          <TabsContent key={day.dayNumber} value={String(day.dayNumber)} className="space-y-4">
            <Card>
              <CardContent className="flex flex-wrap items-center gap-4 pt-4">
                <div className="min-w-[160px] flex-1">
                  <Label className="text-xs text-muted-foreground">{t("day.splitLabel")}</Label>
                  <Input
                    value={day.label}
                    onChange={(e) => updateDay(day.dayNumber, (d) => ({ ...d, label: e.target.value }))}
                    placeholder={t("day.splitPlaceholder")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={day.isRestDay}
                    onCheckedChange={(checked) => updateDay(day.dayNumber, (d) => ({ ...d, isRestDay: checked }))}
                  />
                  <Label className="text-xs">{t("day.restDay")}</Label>
                </div>
                {program.days.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeDay(day.dayNumber)}>
                    {t("day.remove")}
                  </Button>
                )}
              </CardContent>
            </Card>

            {!day.isRestDay && (
              <>
                {day.groups.map((group) => (
                  <div key={group.muscleGroup} className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-primary">{group.muscleGroup}</h3>
                    <div className="space-y-2">
                      {group.exercises.map((entry) => (
                        <ExerciseRow
                          key={entry.id}
                          entry={entry}
                          onChange={(updated) => updateExercise(day.dayNumber, group.muscleGroup, updated)}
                          onRemove={() => removeExercise(day.dayNumber, group.muscleGroup, entry.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <MachinePicker onSelect={(m) => addExercise(day.dayNumber, m)} />
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CardioForm value={program.cardio} onChange={(cardio) => setProgram((p) => ({ ...p, cardio }))} />

      <div className="flex items-center gap-3 pb-8">
        <Button variant="accent" size="lg" onClick={generatePdf} disabled={generating}>
          {generating ? t("generate.generating") : t("generate.button")}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
