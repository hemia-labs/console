import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from './audit.service';
import { ListAuditEventsQueryDto } from './dtos/list-audit-events-query.dto';
import { ensureExternalApiAccess } from '../identity-access/utils/ensure-external-api-access.util';

@Controller('identity-access/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query() query: ListAuditEventsQueryDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.auditService.findAll(query);
  }
}
