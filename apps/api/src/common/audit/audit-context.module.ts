import { Global, Module } from '@nestjs/common';
import { AuditRequestContext } from './audit-request-context';

@Global()
@Module({
  providers: [AuditRequestContext],
  exports: [AuditRequestContext],
})
export class AuditContextModule {}
