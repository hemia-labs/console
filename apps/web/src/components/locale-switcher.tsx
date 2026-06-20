"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n/config";

export function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  // Replace the leading /<locale> segment, keep the rest of the path.
  const rest = pathname.replace(/^\/[^/]+/, "");

  return (
    <select
      aria-label="Idioma"
      value={locale}
      onChange={(e) => {
        document.cookie = `NEXT_LOCALE=${e.target.value};path=/;max-age=31536000;samesite=lax`;
        router.push(`/${e.target.value}${rest}`);
      }}
      className="h-12 rounded-md border border-border bg-background px-2 text-sm"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
