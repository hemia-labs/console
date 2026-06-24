import type { IdentityUser, UserStatus } from "@/features/identity-access/types";

export function userId(user: IdentityUser) {
  return user.id;
}

export function userDisplayName(user: IdentityUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return user.displayName ?? user.name ?? (fullName || user.email) ?? "Usuario sin nombre";
}

export function userInitials(user: IdentityUser) {
  const source = userDisplayName(user);
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function userStatus(user: IdentityUser): UserStatus | string {
  if (user.status) {
    return user.status;
  }

  return user.lockedAt ? "locked" : "active";
}

export function userDate(user: IdentityUser, key: "created" | "updated") {
  const value = key === "created" ? user.createdAt : user.updatedAt;

  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
