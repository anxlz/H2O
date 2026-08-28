"use client";

import type { CardioBlock } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";

type CardioFormProps = {
  value: CardioBlock;
  onChange: (updated: CardioBlock) => void;
};

export function CardioForm({ value, onChange }: CardioFormProps) {
  const { t } = useLanguage();

  return (
    <Card className="border-secondary/40">
      <CardHeader>
        <CardTitle className="text-secondary">{t("cardio.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs text-muted-foreground">{t("cardio.type")}</Label>
          <Input
            value={value.type}
            placeholder={t("cardio.typePlaceholder")}
            onChange={(e) => onChange({ ...value, type: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t("cardio.warmup")}</Label>
          <Input
            type="number"
            min={0}
            value={value.warmupMinutes}
            onChange={(e) => onChange({ ...value, warmupMinutes: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t("cardio.postWorkout")}</Label>
          <Input
            type="number"
            min={0}
            value={value.postWorkoutMinutes}
            onChange={(e) => onChange({ ...value, postWorkoutMinutes: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t("cardio.restBetweenSets")}</Label>
          <Input
            type="number"
            min={0}
            value={value.restBetweenSetsMinutes}
            onChange={(e) => onChange({ ...value, restBetweenSetsMinutes: Number(e.target.value) })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
