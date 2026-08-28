"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      aria-label={t("lang.toggle")}
      title={t("lang.toggle")}
      className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
    >
      <Globe className="h-4 w-4" />
      {locale === "en" ? "العربية" : "EN"}
    </Button>
  );
}
