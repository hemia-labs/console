import { Controller, Get, UseGuards } from '@nestjs/common';
import { SsoAuthGuard, CurrentUser } from '@hemia/auth/nestjs';
import type { AuthenticatedUser } from '@hemia/auth';

@Controller('me')
export class MeController {
  // 401 si no hay sesión válida (SsoAuthGuard -> UnauthorizedError -> SsoExceptionFilter).
  @Get()
  @UseGuards(SsoAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
