"use client";

import { CheckCircle2, PauseCircle, PlayCircle, Power, XCircle } from "lucide-react";
import { useState } from "react";

import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { StatusBadge, type StatusBadgeTone } from "@/components/status-badge";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import {
  changeOrganizationProductStatus,
  enableOrganizationProduct,
} from "./api";
import type {
  AccessProduct,
  EnableOrganizationProductPayload,
  OrganizationProduct,
  OrganizationProductSource,
} from "./types";

const sources: Array<{ label: string; value: OrganizationProductSource }> = [
  { label: "Manual", value: "manual" },
  { label: "Billing", value: "billing" },
  { label: "Contrato", value: "contract" },
  { label: "Migración", value: "migration" },
  { label: "Interno", value: "internal" },
];

const statusMeta: Record<string, { label: string; tone: StatusBadgeTone }> = {
  active: { label: "Activo", tone: "success" },
  deprecated: { label: "Deprecado", tone: "warning" },
  disabled: { label: "Deshabilitado", tone: "danger" },
  enabled: { label: "Habilitado", tone: "success" },
  expired: { label: "Expirado", tone: "danger" },
  failed: { label: "Fallido", tone: "danger" },
  pending: { label: "Pendiente", tone: "warning" },
  provisioning: { label: "Provisionando", tone: "warning" },
  suspended: { label: "Suspendido", tone: "warning" },
};

function badge(status?: string | null) {
  const meta = statusMeta[status ?? ""] ?? {
    label: status || "Sin acceso",
    tone: "muted" as const,
  };
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

function productOf(product: AccessProduct, organizationProducts: OrganizationProduct[]) {
  return organizationProducts.find(
    (organizationProduct) =>
      organizationProduct.productId === product.id ||
      organizationProduct.product?.code === product.code
  );
}

export function OrganizationProductsSection({
  organizationProductsError,
  onRefresh,
  organizationId,
  organizationProducts,
  products,
  productsError,
}: {
  organizationProductsError?: string | null;
  onRefresh: () => void;
  organizationId: string;
  organizationProducts: OrganizationProduct[];
  products: AccessProduct[];
  productsError?: string | null;
}) {
  const [selectedProduct, setSelectedProduct] = useState<AccessProduct | null>(null);
  const [source, setSource] = useState<OrganizationProductSource>("manual");
  const [entitlementReference, setEntitlementReference] = useState("");
  const [configuration, setConfiguration] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  function resetForm() {
    setSelectedProduct(null);
    setSource("manual");
    setEntitlementReference("");
    setConfiguration("");
    setFormError(null);
  }

  async function submitEnable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    let parsedConfiguration: Record<string, unknown> | undefined;
    if (configuration.trim()) {
      try {
        const parsed: unknown = JSON.parse(configuration);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error();
        }
        parsedConfiguration = parsed as Record<string, unknown>;
      } catch {
        setFormError("Configuration debe contener un objeto JSON válido.");
        return;
      }
    }

    const payload: EnableOrganizationProductPayload = {
      configuration: parsedConfiguration,
      entitlement_reference: entitlementReference.trim() || undefined,
      source,
    };

    setPendingKey(selectedProduct.code);
    setFormError(null);
    setActionError(null);
    try {
      await enableOrganizationProduct(organizationId, selectedProduct.code, payload);
      resetForm();
      onRefresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setPendingKey(null);
    }
  }

  async function runAction(
    productCode: string,
    action: "activate" | "disable" | "suspend"
  ) {
    setPendingKey(productCode);
    setActionError(null);
    try {
      await changeOrganizationProductStatus(organizationId, productCode, action);
      onRefresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="text-base font-semibold">Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra los productos habilitados para esta organización.
        </p>
      </div>

      {productsError ? (
        <ErrorState
          className="m-5"
          error={new Error(productsError)}
          onRetry={onRefresh}
          title="No se pudo cargar el catálogo"
        />
      ) : null}

      {organizationProductsError ? (
        <ErrorState
          className="m-5"
          error={new Error(organizationProductsError)}
          onRetry={onRefresh}
          title="No se pudieron cargar los accesos de la organización"
        />
      ) : null}

      {actionError ? <p className="mx-5 mt-5 text-sm font-medium text-destructive" role="alert">{actionError}</p> : null}

      {selectedProduct ? (
        <form className="m-5 rounded-lg border border-border bg-background p-5" onSubmit={submitEnable}>
          <h3 className="text-base font-semibold">Habilitar {selectedProduct.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configura el acceso de {selectedProduct.code} para esta organización.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Fuente
              <select
                className="h-8 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onChange={(event) => setSource(event.target.value as OrganizationProductSource)}
                value={source}
              >
                {sources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Referencia de entitlement
              <Input
                className="h-8 bg-card"
                onChange={(event) => setEntitlementReference(event.target.value)}
                value={entitlementReference}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Configuration (JSON)
              <Textarea
                className="min-h-32 bg-card font-mono text-xs"
                onChange={(event) => setConfiguration(event.target.value)}
                placeholder='{"plan":"enterprise"}'
                value={configuration}
              />
              <span className="text-xs text-muted-foreground">Opcional. Debe ser un objeto JSON válido.</span>
            </label>
          </div>
          {formError ? <p className="mt-4 text-sm font-medium text-destructive" role="alert">{formError}</p> : null}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="h-8" onClick={resetForm} type="button" variant="outline">Cancelar</Button>
            <Button className="h-8" disabled={pendingKey === selectedProduct.code} type="submit">
              {pendingKey === selectedProduct.code ? "Habilitando..." : "Habilitar producto"}
            </Button>
          </div>
        </form>
      ) : null}

      {!productsError && products.length === 0 ? (
        <EmptyState className="m-5" description="No hay productos disponibles en el catálogo." title="Catálogo vacío" />
      ) : null}

      {!productsError && products.length > 0 ? (
        <div className="overflow-x-auto p-5 pt-0">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Producto</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Código</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Audiencia</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Provisioning</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Acceso</TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const access = productOf(product, organizationProducts);
                const accessStatus = access?.status;
                const pending = pendingKey === product.code;
                const canEnable = !organizationProductsError && product.status === "active" && [undefined, "disabled", "failed", "expired"].includes(accessStatus ?? undefined);
                const canAct = !organizationProductsError && accessStatus === "suspended";
                const canSuspend = !organizationProductsError && accessStatus === "enabled";
                const canDisable = !organizationProductsError && ["enabled", "suspended"].includes(accessStatus ?? "");

                return (
                  <TableRow className="hover:bg-muted/60" key={product.code}>
                    <TableCell className="px-4 py-3 font-semibold">
                      <div>{product.name}</div>
                      {product.status && product.status !== "active" ? <div className="mt-1">{badge(product.status)}</div> : null}
                      {product.description ? <div className="mt-1 max-w-xs text-xs font-normal text-muted-foreground">{product.description}</div> : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{product.code}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{product.audience || "No disponible"}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{product.provisioningMode || "No disponible"}</TableCell>
                    <TableCell className="px-4 py-3">{badge(accessStatus)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canEnable ? (
                          <Button className="h-8" disabled={pending} onClick={() => { setSelectedProduct(product); setFormError(null); }} type="button">
                            <CheckCircle2 className="size-4" />Habilitar
                          </Button>
                        ) : null}
                        {canAct ? (
                          <Button className="h-8" disabled={pending} onClick={() => void runAction(product.code, "activate")} type="button" variant="secondary">
                            <PlayCircle className="size-4" />Activar
                          </Button>
                        ) : null}
                        {canSuspend ? (
                          <ConfirmAction confirmMessage={`¿Quieres suspender ${product.name}?`} disabled={pending} onConfirm={() => void runAction(product.code, "suspend")}>
                            <PauseCircle className="size-4" />Suspender
                          </ConfirmAction>
                        ) : null}
                        {canDisable ? (
                          <ConfirmAction confirmMessage={`Esta acción deshabilitará ${product.name}. ¿Continuar?`} disabled={pending} onConfirm={() => void runAction(product.code, "disable")} variant="destructive">
                            <Power className="size-4" />Deshabilitar
                          </ConfirmAction>
                        ) : null}
                        {!canEnable && !canAct && !canSuspend && !canDisable && accessStatus ? (
                          <span className="inline-flex h-8 items-center gap-2 text-xs text-muted-foreground"><XCircle className="size-4" />Sin acciones</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
