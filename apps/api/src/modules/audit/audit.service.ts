import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { ListAuditEventsQueryDto } from './dtos/list-audit-events-query.dto';
import { AuditEvent } from './entities/audit-event.entity';
import { AuditEventStatus } from './types/audit-event-status';
import {
  sanitizeAuditMessage,
  sanitizeAuditMetadata,
} from './utils/audit-sanitize.util';

export interface RecordAuditEventInput {
  actorSubject?: string | null;
  actorSource: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  status: AuditEventStatus;
  httpMethod: string;
  route: string;
  hemiaIdPath?: string | null;
  hemiaIdRequestId?: string | null;
  metadata?: Record<string, unknown>;
  errorCode?: string | null;
  errorMessage?: unknown;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  async record(input: RecordAuditEventInput): Promise<void> {
    try {
      await this.auditEventRepository.save(
        this.auditEventRepository.create({
          ...input,
          metadata: sanitizeAuditMetadata(input.metadata ?? {}),
          errorMessage: sanitizeAuditMessage(input.errorMessage),
        }),
      );
    } catch {
      return undefined;
    }
  }

  async findAll(query: ListAuditEventsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);
    const [data, total] = await this.auditEventRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: data.map((event) => ({
        id: event.id,
        actorSubject: event.actorSubject,
        actorSource: event.actorSource,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        status: event.status,
        httpMethod: event.httpMethod,
        route: event.route,
        hemiaIdPath: event.hemiaIdPath,
        hemiaIdRequestId: event.hemiaIdRequestId,
        metadata: sanitizeAuditMetadata(event.metadata),
        errorCode: event.errorCode,
        errorMessage: sanitizeAuditMessage(event.errorMessage),
        createdAt: event.createdAt,
      })),
      page,
      limit,
      total,
    };
  }

  private buildWhere(
    query: ListAuditEventsQueryDto,
  ): FindOptionsWhere<AuditEvent> {
    const where: FindOptionsWhere<AuditEvent> = {};

    if (query.actorSubject) where.actorSubject = query.actorSubject;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.status) where.status = query.status;
    if (query.hemiaIdRequestId) where.hemiaIdRequestId = query.hemiaIdRequestId;

    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where.createdAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where.createdAt = LessThanOrEqual(new Date(query.to));
    }

    return where;
  }
}
