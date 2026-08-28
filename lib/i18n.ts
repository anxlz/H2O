// Lightweight, dependency-free i18n. No next-intl/next-i18next — this app
// only has a couple dozen UI strings (exercise/machine names stay in
// English; they're data, not chrome), so a plain dictionary + context is
// enough and keeps the "no network in this sandbox" constraint from
// blocking on a package that isn't already installed.

export type Locale = "en" | "ar";

export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

type Dict = Record<string, string>;

export const translations: Record<Locale, Dict> = {
  en: {
    "app.subtitle": "Program Builder",
    "theme.toggle": "Toggle theme",
    "lang.toggle": "Switch language",

    "member.title": "Member & Trainer",
    "member.name": "Member name",
    "member.namePlaceholder": "e.g. Mohamed Fathy",
    "trainer.name": "Trainer name",
    "trainer.namePlaceholder": "e.g. Ahmed Redah",

    "day.add": "+ Add day",
    "day.prefix": "Day",
    "day.splitLabel": "Split label",
    "day.splitPlaceholder": "Push / Pull / Leg / Rest",
    "day.restDay": "Rest day",
    "day.remove": "Remove day",

    "cardio.title": "Cardio & Rest",
    "cardio.type": "Cardio type",
    "cardio.typePlaceholder": "Treadmill",
    "cardio.warmup": "Warm up (min)",
    "cardio.postWorkout": "Post workout (min)",
    "cardio.restBetweenSets": "Rest between sets (min)",

    "exercise.unknown": "Unknown machine",
    "exercise.sets": "Sets",
    "exercise.reps": "Reps",
    "exercise.technique": "Technique",
    "exercise.techniquePlaceholder": "1-0-1",
    "exercise.rest": "Rest (sec)",
    "exercise.freeWeight": "Free weight",
    "exercise.remove": "Remove exercise",

    "picker.addExercise": "+ Add exercise",
    "picker.search": "Search machines...",
    "picker.category": "Category",
    "picker.allCategories": "All categories",
    "picker.cardio": "Cardio",
    "picker.close": "Close",
    "picker.empty": "No machines match. Try a different search or category.",

    "generate.button": "Generate PDF",
    "generate.generating": "Generating...",
  },
  ar: {
    "app.subtitle": "منشئ البرامج",
    "theme.toggle": "تبديل المظهر",
    "lang.toggle": "تبديل اللغة",

    "member.title": "المتدرب والمدرب",
    "member.name": "اسم المتدرب",
    "member.namePlaceholder": "مثال: محمد فتحي",
    "trainer.name": "اسم المدرب",
    "trainer.namePlaceholder": "مثال: أحمد رضا",

    "day.add": "+ إضافة يوم",
    "day.prefix": "يوم",
    "day.splitLabel": "تقسيم اليوم",
    "day.splitPlaceholder": "دفع / سحب / أرجل / راحة",
    "day.restDay": "يوم راحة",
    "day.remove": "حذف اليوم",

    "cardio.title": "الكارديو والراحة",
    "cardio.type": "نوع الكارديو",
    "cardio.typePlaceholder": "جهاز الجري",
    "cardio.warmup": "الإحماء (دقيقة)",
    "cardio.postWorkout": "بعد التمرين (دقيقة)",
    "cardio.restBetweenSets": "الراحة بين المجموعات (دقيقة)",

    "exercise.unknown": "جهاز غير معروف",
    "exercise.sets": "المجموعات",
    "exercise.reps": "التكرارات",
    "exercise.technique": "التقنية",
    "exercise.techniquePlaceholder": "1-0-1",
    "exercise.rest": "الراحة (ثانية)",
    "exercise.freeWeight": "وزن حر",
    "exercise.remove": "حذف التمرين",

    "picker.addExercise": "+ إضافة تمرين",
    "picker.search": "ابحث عن جهاز...",
    "picker.category": "الفئة",
    "picker.allCategories": "كل الفئات",
    "picker.cardio": "كارديو",
    "picker.close": "إغلاق",
    "picker.empty": "لا توجد أجهزة مطابقة. جرّب بحثًا أو فئة مختلفة.",

    "generate.button": "إنشاء PDF",
    "generate.generating": "جارٍ الإنشاء...",
  },
};

export function translate(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}
