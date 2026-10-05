import type {
  SystemHealthProbePort,
  SystemHealthSnapshot
} from '@/modules/operations/application/ports/system-health-probe.port';
import { currentLoad, fsSize, mem, networkInterfaceDefault, networkStats, osInfo, time } from 'systeminformation';

type NodeSystemHealthProbeConfig = {
  diskPath: string;
};

const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * 1024 * 1024;

export class NodeSystemHealthProbe implements SystemHealthProbePort {
  constructor(private readonly config: NodeSystemHealthProbeConfig) {}

  async collect(): Promise<SystemHealthSnapshot> {
    const [cpu, memory, disks, defaultNetworkInterface, os, systemTime] = await Promise.all([
      currentLoad(),
      mem(),
      fsSize(this.config.diskPath),
      networkInterfaceDefault().catch(() => ''),
      osInfo(),
      time()
    ]);
    const network = defaultNetworkInterface ? await networkStats(defaultNetworkInterface).catch(() => []) : [];
    const disk = this.selectDisk(disks);
    const processMemory = process.memoryUsage();

    return {
      checkedAt: new Date().toISOString(),
      hostname: os.hostname,
      platform: `${os.platform} ${os.release}`,
      uptimeSeconds: systemTime.uptime,
      cpu: {
        usagePercent: this.round(cpu.currentLoad),
        loadAverage: this.round(cpu.avgLoad),
        cores: cpu.cpus.length
      },
      memory: {
        totalMb: this.bytesToMb(memory.total),
        usedMb: this.bytesToMb(memory.used),
        usagePercent: this.round((memory.used / memory.total) * 100)
      },
      disk: {
        path: this.config.diskPath,
        mount: disk.mount,
        totalGb: this.bytesToGb(disk.size),
        usedGb: this.bytesToGb(disk.used),
        usagePercent: this.round(disk.use)
      },
      process: {
        rssMb: this.bytesToMb(processMemory.rss),
        heapUsedMb: this.bytesToMb(processMemory.heapUsed)
      },
      network: {
        iface: network[0]?.iface ?? (defaultNetworkInterface || null),
        rxBytesPerSecond: network[0]?.rx_sec ?? 0,
        txBytesPerSecond: network[0]?.tx_sec ?? 0
      }
    };
  }

  private selectDisk(disks: Awaited<ReturnType<typeof fsSize>>): Awaited<ReturnType<typeof fsSize>>[number] {
    const exactMount = disks.find((disk) => disk.mount === this.config.diskPath);
    return (
      exactMount ??
      disks[0] ?? { fs: '', type: '', mount: this.config.diskPath, size: 0, used: 0, available: 0, use: 0, rw: null }
    );
  }

  private bytesToMb(value: number): number {
    return this.round(value / BYTES_PER_MB);
  }

  private bytesToGb(value: number): number {
    return this.round(value / BYTES_PER_GB);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
