import type { Locale } from "./config";

// Official Next.js pattern: load the dictionary on the server, only the active locale.
const dictionaries = {
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["es"]>>;

export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
