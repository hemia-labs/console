import { expect, test } from "bun:test";
import {
  buildAssignmentPayload,
  parseTargetIds,
  scopeName,
} from "../../apps/web/src/features/access/system-role-assignment-model";

const member = "00000000-0000-4000-8000-000000000001";
const role = "00000000-0000-4000-8000-000000000002";
const organization = "00000000-0000-4000-8000-000000000003";
const application = "00000000-0000-4000-8000-000000000004";
const selection = {
  membershipId: member,
  roleId: role,
  organizationIds: [organization],
  resourceIds: [application],
};
const request = {
  idempotencyKey: "00000000-0000-4000-8000-000000000005",
  validFrom: "2026-11-18T12:00:00.000Z",
  expiresAt: null,
};

test("the same form preserves the Billing contract and ignores target IDs for global scopes", () => {
  const billing = { resource: "all_customers", consumer: "not_applicable" };
  expect(
    buildAssignmentPayload({ ...selection, scope: billing }, request),
  ).toEqual({
    membershipId: member,
    roleId: role,
    scopeType: "all_customers",
    organizationIds: [],
    ...request,
  });
  expect(
    buildAssignmentPayload(
      { ...selection, scope: { ...billing, resource: "organizations" } },
      request,
    ).organizationIds,
  ).toEqual([organization]);
});

test("Legal sends the approved resource and consumer scopes independently", () => {
  const legal = { resource: "applications", consumer: "organizations" };
  expect(scopeName(legal)).toBe(
    "Aplicaciones específicas · Organizaciones consumidoras específicas",
  );
  expect(
    buildAssignmentPayload({ ...selection, scope: legal }, request),
  ).toEqual({
    membershipId: member,
    roleId: role,
    scopeType: "applications",
    consumerScopeType: "organizations",
    organizationIds: [organization],
    resourceIds: [application],
    ...request,
  });
});

test("manual target entry validates identifiers and deduplicates selected targets", () => {
  expect(
    parseTargetIds([organization], `${organization},\n${application}`),
  ).toEqual([organization, application]);
  expect(() => parseTargetIds([], "aplicación")).toThrow("UUID");
});
