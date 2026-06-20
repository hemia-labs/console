import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditUpstreamCall {
  source: 'admin' | 'external';
  method: string;
  path: string;
  requestId?: string;
}

interface AuditRequestStore {
  upstreamCalls: AuditUpstreamCall[];
}

@Injectable()
export class AuditRequestContext {
  private readonly storage = new AsyncLocalStorage<AuditRequestStore>();

  run<T>(callback: () => T): T {
    return this.storage.run({ upstreamCalls: [] }, callback);
  }

  addUpstreamCall(call: AuditUpstreamCall): void {
    this.storage.getStore()?.upstreamCalls.push(call);
  }

  getUpstreamCalls(): AuditUpstreamCall[] {
    return [...(this.storage.getStore()?.upstreamCalls ?? [])];
  }
}
