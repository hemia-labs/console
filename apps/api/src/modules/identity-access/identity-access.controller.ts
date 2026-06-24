import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { HemiaIdHealthDto } from './dtos/hemia-id-health.dto';
import { IdentityAccessService } from './identity-access.service';

@UseGuards(SsoAuthGuard)
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
