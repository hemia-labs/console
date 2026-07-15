export type HemiaIdHealthStatus = 'ok' | 'degraded';

export class HemiaIdHealthDto {
  status: HemiaIdHealthStatus;
  live: unknown;
  startup: unknown;
  ready: unknown;
}
