import type { OAuthServiceDestination } from "./types";

export function OAuthServiceDestinations({ destinations }: { destinations?: OAuthServiceDestination[] | null }) {
  if (!destinations?.length) return null;
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="service-destinations-heading">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold" id="service-destinations-heading">Destinos autorizados</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cada token lleva una sola audiencia y los scopes solicitados y autorizados para ese destino.</p>
      </div>
      <ul className="divide-y divide-border">
        {destinations.map((destination) => (
          <li className="space-y-4 p-5" key={destination.resource}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Audiencia</dt><dd className="mt-1 break-words text-sm font-medium">{destination.audience}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Destino (resource)</dt><dd className="mt-1 break-all font-mono text-xs">{destination.resource}</dd></div>
            </dl>
            <div>
              <h3 className="text-xs text-muted-foreground">Scopes permitidos</h3>
              {destination.scopes.length ? <ul className="mt-2 flex flex-wrap gap-2">{destination.scopes.map(scope => <li className="max-w-full break-all rounded-md border border-border px-2 py-1 font-mono text-xs" key={scope}>{scope}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Sin scopes permitidos</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
