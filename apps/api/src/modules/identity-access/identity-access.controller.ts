import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '@hemia/auth/nestjs';

import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { HemiaIdHealthDto } from './dtos/hemia-id-health.dto';
import { IdentityAccessService } from './identity-access.service';

@UseGuards(SsoCurrentUserAuthGuard)
@Controller('identity-access')
export class IdentityAccessController {
  constructor(private readonly identityAccessService: IdentityAccessService) {}

  @Get('health/hemia-id')
  async getHemiaIdHealth(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<HemiaIdHealthDto> {
    return this.identityAccessService.getHemiaIdHealth(currentUser);
  }
}
