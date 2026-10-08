"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ErrorState } from "@/components/error-state";
import { ConsoleApiError } from "@/lib/console-api";
import { SESSION_FAILURE_EVENT } from "@/lib/console-auth";
import { getConsoleSession, type ConsoleSession } from "./console-session";

const SessionContext = createContext<ConsoleSession | null>(null);
type SessionState =
  | { kind: "loading" }
  | { kind: "ready"; session: ConsoleSession }
  | { kind: "blocked"; status: number | null };

export function ConsoleSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const onFailure = (event: Event) => {
      controller.abort();
      setState({
        kind: "blocked",
        status: (event as CustomEvent<number>).detail,
      });
    };
    window.addEventListener(SESSION_FAILURE_EVENT, onFailure);
    getConsoleSession(controller.signal)
      .then((session) => {
        if (!controller.signal.aborted) setState({ kind: "ready", session });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            kind: "blocked",
            status: error instanceof ConsoleApiError ? error.status : null,
          });
        }
      });
    return () => {
      controller.abort();
      window.removeEventListener(SESSION_FAILURE_EVENT, onFailure);
    };
  }, [attempt]);

  if (state.kind === "ready") {
    return (
      <SessionContext.Provider value={state.session}>
        {children}
      </SessionContext.Provider>
    );
  }
  if (state.kind === "loading" || state.status === 401) {
    return (
      <main className="grid min-h-screen place-items-center p-6" role="status">
        Validando sesión…
      </main>
    );
  }
  const denied = state.status === 403;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <ErrorState
        title={denied ? "Acceso no disponible" : "No se pudo validar el acceso"}
        error={
          new Error(
            denied
              ? "Console requiere un superadministrador de plataforma activo con acceso habilitado."
              : state.status === 429
                ? "Espera un momento antes de intentar de nuevo."
                : "El servicio de autorización no está disponible. Intenta nuevamente."
          )
        }
        onRetry={() => {
          setState({ kind: "loading" });
          setAttempt((value) => value + 1);
        }}
      />
    </main>
  );
}

export function useConsoleSession(): ConsoleSession {
  const session = useContext(SessionContext);
  if (!session)
    throw new Error(
      "useConsoleSession must be used inside ConsoleSessionProvider"
    );
  return session;
}
