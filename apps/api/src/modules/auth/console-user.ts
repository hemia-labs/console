import type { AuthenticatedUser } from '@hemia/auth';

export type ConsoleUser = Pick<
  AuthenticatedUser,
  'sub' | 'iss' | 'email' | 'name'
>;

export function toConsoleUser(user: AuthenticatedUser): ConsoleUser {
  return { sub: user.sub, iss: user.iss, email: user.email, name: user.name };
}
