export type SystemHealthSnapshot = {
  checkedAt: string;
  hostname: string;
  platform: string;
  uptimeSeconds: number;
  cpu: {
    usagePercent: number;
    loadAverage: number;
    cores: number;
  };
  memory: {
    totalMb: number;
    usedMb: number;
    usagePercent: number;
  };
  disk: {
    path: string;
    mount: string;
    totalGb: number;
    usedGb: number;
    usagePercent: number;
  };
  process: {
    rssMb: number;
    heapUsedMb: number;
  };
  network: {
    iface: string | null;
    rxBytesPerSecond: number;
    txBytesPerSecond: number;
  };
};

export interface SystemHealthProbePort {
  collect(): Promise<SystemHealthSnapshot>;
}
