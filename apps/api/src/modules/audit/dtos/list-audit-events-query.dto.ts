import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AuditEventStatus } from '../types/audit-event-status';

export class ListAuditEventsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un entero' })
  @Min(1, { message: 'La pagina debe ser mayor o igual a 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un entero' })
  @Min(1, { message: 'El limite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El limite no puede exceder 100' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: 'El actorSubject debe ser una cadena de texto' })
  actorSubject?: string;

  @IsOptional()
  @IsString({ message: 'La action debe ser una cadena de texto' })
  action?: string;

  @IsOptional()
  @IsString({ message: 'El resource debe ser una cadena de texto' })
  resource?: string;

  @IsOptional()
  @IsString({ message: 'El resourceId debe ser una cadena de texto' })
  resourceId?: string;

  @IsOptional()
  @IsEnum(AuditEventStatus, { message: 'El status de auditoria no es valido' })
  status?: AuditEventStatus;

  @IsOptional()
  @IsDateString({}, { message: 'El from debe ser una fecha valida' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'El to debe ser una fecha valida' })
  to?: string;

  @IsOptional()
  @IsString({ message: 'El hemiaIdRequestId debe ser una cadena de texto' })
  hemiaIdRequestId?: string;
}
