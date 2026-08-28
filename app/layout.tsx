import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "H2O Gym — Program Builder",
  description: "Build member workout programs and generate branded PDFs.",
};

// Runs before React hydrates, so there's no flash of the wrong theme/direction
// and no hydration mismatch on the attributes it sets (that's what
// suppressHydrationWarning below is for — same pattern next-themes uses).
// Falls back to the OS color-scheme preference on first visit, then remembers
// whatever the user picked via the header toggles.
const THEME_LANG_BOOTSTRAP = `(function () {
  try {
    var theme = localStorage.getItem("h2o-gym-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme ? theme === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);

    var locale = localStorage.getItem("h2o-gym-locale") || "en";
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is scoped to this element only (it does not
    // cascade to children) and is the documented fix for exactly this
    // situation: the bootstrap script above intentionally changes
    // `class`/`lang`/`dir` on <html> before React hydrates, and browser
    // extensions (e.g. the `cz-shortcut-listen` / `className="hydrated"`
    // attributes some extensions inject) can do the same to <body> — neither
    // reflects a real server/client markup bug.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_LANG_BOOTSTRAP }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <AppHeader />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
