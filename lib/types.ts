// Data model — matches references/data-model.md in the h2o-gym-program-builder
// skill. Kept as plain types for this first slice (in-memory / local state);
// swap for Prisma/Drizzle-generated types once Postgres is wired up.

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Trapezius"
  | "Biceps"
  | "Triceps"
  | "Quadriceps"
  | "Hamstring"
  | "Calves"
  | "Legs"
  | "Abs"
  | "Forearms"
  | "Full Body"
  | "Other";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Trapezius",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstring",
  "Calves",
  "Legs",
  "Abs",
  "Forearms",
  "Full Body",
  "Other",
];

export type Equipment =
  | "Barbell"
  | "Dumbbell"
  | "Cable"
  | "Machine"
  | "Smith Machine"
  | "Bodyweight"
  | "Band"
  | "Kettlebell"
  | "Cardio Machine"
  | "Bench"
  | "EZ Bar"
  | "Landmine"
  | "Trap Bar"
  | "Safety Bar"
  | "Sled"
  | "Box"
  | "Plate"
  | "None";

export const EQUIPMENT_TYPES: Equipment[] = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Smith Machine",
  "Bodyweight",
  "Band",
  "Kettlebell",
  "Cardio Machine",
  "Bench",
  "EZ Bar",
  "Landmine",
  "Trap Bar",
  "Safety Bar",
  "Sled",
  "Box",
  "Plate",
  "None",
];

export type Machine = {
  id: string;
  name: string;
  category: MuscleGroup | "Cardio";
  equipment: Equipment;
  thumbnailUrl?: string;
  videoUrl?: string;
};

export type Weight =
  | { kind: "value"; amount: number; unit: "kg" | "lb" }
  | { kind: "freeWeight" };

export type ExerciseEntry = {
  id: string; // client-side id for list rendering / editing
  machineId: string;
  seq: number;
  sets: number;
  reps: number;
  weight: Weight;
  technique: string;
  restSeconds: number;
};

export type ProgramDay = {
  dayNumber: number;
  label: string;
  isRestDay: boolean;
  groups: { muscleGroup: MuscleGroup; exercises: ExerciseEntry[] }[];
};

export type CardioBlock = {
  type: string;
  warmupMinutes: number;
  postWorkoutMinutes: number;
  restBetweenSetsMinutes: number;
};

export type Program = {
  memberName: string;
  trainerName: string;
  days: ProgramDay[];
  cardio: CardioBlock;
};

export function emptyWeight(): Weight {
  return { kind: "value", amount: 150, unit: "lb" };
}

export function weightLabel(w: Weight): string {
  if (w.kind === "freeWeight") return "FREE WEIGHT";
  return `${w.amount} ${w.unit}`;
}
