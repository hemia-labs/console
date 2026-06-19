import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { HemiaIdHealthDto } from './dtos/hemia-id-health.dto';
import { IdentityAccessService } from './identity-access.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access')
export class IdentityAccessController {
  constructor(private readonly identityAccessService: IdentityAccessService) {}

  @Get('health/hemia-id')
  getHemiaIdHealth(@Req() request: Request): Promise<HemiaIdHealthDto> {
    return this.identityAccessService.getHemiaIdHealth(
      extractHemiaIdAuth(request),
    );
  }
}
