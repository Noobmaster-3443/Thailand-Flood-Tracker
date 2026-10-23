export * from './telemetry';
export * from './weather';

export interface FilterState {
  district: string;
  severity: import('./telemetry').SeverityLevel | 'all';
  onlyPassable: boolean | null;
  searchQuery: string;
  onlyVerified: boolean;
}

