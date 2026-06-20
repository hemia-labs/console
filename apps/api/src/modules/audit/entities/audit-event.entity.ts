import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditEventStatus } from '../types/audit-event-status';

@Entity('audit_events')
@Index('IDX_audit_events_created_at', ['createdAt'])
@Index('IDX_audit_events_actor_subject', ['actorSubject'])
@Index('IDX_audit_events_resource_resource_id', ['resource', 'resourceId'])
@Index('IDX_audit_events_action', ['action'])
@Index('IDX_audit_events_status', ['status'])
@Index('IDX_audit_events_hemia_id_request_id', ['hemiaIdRequestId'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_subject', type: 'varchar', length: 255, nullable: true })
  actorSubject?: string | null;

  @Column({ name: 'actor_source', type: 'varchar', length: 40 })
  actorSource: string;

  @Column({ type: 'varchar', length: 180 })
  action: string;

  @Column({ type: 'varchar', length: 120 })
  resource: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId?: string | null;

  @Column({
    type: 'enum',
    enum: AuditEventStatus,
    enumName: 'audit_event_status',
  })
  status: AuditEventStatus;

  @Column({ name: 'http_method', type: 'varchar', length: 12 })
  httpMethod: string;

  @Column({ type: 'varchar', length: 500 })
  route: string;

  @Column({ name: 'hemia_id_path', type: 'varchar', length: 500, nullable: true })
  hemiaIdPath?: string | null;

  @Column({
    name: 'hemia_id_request_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  hemiaIdRequestId?: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column({ name: 'error_code', type: 'varchar', length: 80, nullable: true })
  errorCode?: string | null;

  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
