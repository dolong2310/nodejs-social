export interface SystemHealthJobData {
  triggeredBy?: 'schedule' | 'manual';
}

export type SystemHealthSeverity = 'warning' | 'critical';

export type SystemHealthMetric = 'cpu' | 'memory' | 'disk' | 'process-memory';

export type SystemHealthBreach = {
  metric: SystemHealthMetric;
  severity: SystemHealthSeverity;
  value: number;
  threshold: number;
  unit: '%' | 'MB';
};

export interface SystemHealthJobResult {
  checkedAt: string;
  status: 'healthy' | 'breached';
  breaches: SystemHealthBreach[];
  alertsSent: number;
}
