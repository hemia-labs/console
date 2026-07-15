import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SsoAuthGuard } from '@hemia/auth/nestjs';

@Injectable()
export class SsoCurrentUserAuthGuard implements CanActivate {
  constructor(private readonly ssoAuthGuard: SsoAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.ssoAuthGuard.canActivate(context);
  }
}
