export type HemiaIdHealthStatus = 'ok' | 'degraded';

export class HemiaIdHealthDto {
  status: HemiaIdHealthStatus;
  hemiaId: unknown;
  database: unknown;
}
