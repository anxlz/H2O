"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { machines } from "@/lib/machines-seed";
import type { Machine, MuscleGroup } from "@/lib/types";
import { MUSCLE_GROUPS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

type MachinePickerProps = {
  onSelect: (machine: Machine) => void;
  defaultCategory?: MuscleGroup | "Cardio";
  triggerLabel?: string;
};

export function MachinePicker({ onSelect, defaultCategory, triggerLabel }: MachinePickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(defaultCategory ?? "All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return machines.filter((m) => {
      const matchesCategory = category === "All" || m.category === category;
      const matchesQuery = m.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel ?? t("picker.addExercise")}
      </Button>
    );
  }

  return (
    <Card className="border-primary/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder={t("picker.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
            autoFocus
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("picker.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t("picker.allCategories")}</SelectItem>
              {MUSCLE_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
              <SelectItem value="Cardio">{t("picker.cardio")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="ms-auto" onClick={() => setOpen(false)}>
            {t("picker.close")}
          </Button>
        </div>

        <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pe-1 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m);
                setOpen(false);
                setQuery("");
              }}
              className="overflow-hidden rounded-lg border border-border bg-background text-start transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="relative aspect-square bg-muted">
                {m.thumbnailUrl ? (
                  <Image
                    src={encodeURI(m.thumbnailUrl)}
                    alt={m.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                    {m.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-xs font-semibold leading-tight">{m.name}</p>
                <Badge variant="muted" className="mt-1 text-[10px]">
                  {m.equipment}
                </Badge>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              {t("picker.empty")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
