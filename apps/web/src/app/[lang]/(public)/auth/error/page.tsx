import { consoleLoginUrl, normalizeAuthError } from "@/lib/console-auth";

export default async function AuthErrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { lang } = await params;
  const { error } = await searchParams;
  const reason = normalizeAuthError(error);
  const message =
    reason === "access_denied"
      ? "Tu usuario no tiene el acceso requerido para Console."
      : reason === "access_unavailable"
        ? "Access no está disponible. Intenta nuevamente cuando se restablezca el servicio."
        : "No se pudo completar el inicio de sesión. Puedes volver a intentarlo.";
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section
        className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm"
        aria-labelledby="auth-error-title"
      >
        <h1 id="auth-error-title" className="text-xl font-semibold">
          No se pudo iniciar sesión
        </h1>
        <p className="mt-3 text-sm text-muted-foreground" role="alert">
          {message}
        </p>
        <a
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
          href={consoleLoginUrl(`/${lang}`)}
        >
          Intentar de nuevo
        </a>
      </section>
    </main>
  );
}
