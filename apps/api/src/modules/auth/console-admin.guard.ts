import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { SsoAuthGuard } from '@hemia/auth/nestjs';
import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from './console-authorization.service';

@Injectable()
export class ConsoleAdminGuard implements CanActivate {
  constructor(
    private readonly sso: SsoAuthGuard,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await this.sso.canActivate(context))) return false;
    await this.authorization.authorize(
      context.switchToHttp().getRequest<ConsoleRequest>(),
    );
    return true;
  }
}
