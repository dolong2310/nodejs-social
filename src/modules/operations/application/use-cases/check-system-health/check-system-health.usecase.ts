import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { EmailSenderPort } from '@/modules/core/application/ports/email-sender.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  SystemHealthBreach,
  SystemHealthJobResult,
  SystemHealthSeverity
} from '@/modules/operations/application/ports/system-health-job.port';
import { SystemHealthProbePort } from '@/modules/operations/application/ports/system-health-probe.port';
import { CheckSystemHealthPort } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.port';

type SystemHealthThresholds = {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  processMemoryMb: { warning: number; critical: number };
};

type CheckSystemHealthConfig = {
  adminEmails: string[];
  alertCooldownSeconds: number;
  thresholds: SystemHealthThresholds;
};

type AlertState = {
  severity: SystemHealthSeverity;
  sentAt: string;
  value: number;
};

const ALERT_CACHE_KEY_PREFIX = 'operations:system-health:alert';

export class CheckSystemHealthUseCase extends CheckSystemHealthPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly probe: SystemHealthProbePort,
    private readonly cacheManager: CacheManagerPort,
    private readonly emailSender: EmailSenderPort,
    private readonly logger: LoggerPort,
    private readonly config: CheckSystemHealthConfig
  ) {
    super();
    this.log = this.logger.child({ module: 'check-system-health' });
  }

  async execute(): Promise<SystemHealthJobResult> {
    const snapshot = await this.probe.collect();
    const breaches = this.findBreaches(snapshot);
    const sendableBreaches = await this.filterSendableBreaches(breaches);

    if (sendableBreaches.length > 0 && this.config.adminEmails.length > 0) {
      await this.sendAlertEmail(snapshot, sendableBreaches);
      await this.markAlertsSent(sendableBreaches);
    }

    const result: SystemHealthJobResult = {
      checkedAt: snapshot.checkedAt,
      status: breaches.length > 0 ? 'breached' : 'healthy',
      breaches,
      alertsSent: sendableBreaches.length > 0 && this.config.adminEmails.length > 0 ? 1 : 0
    };

    this.log.info(
      {
        status: result.status,
        breaches,
        alertsSent: result.alertsSent,
        snapshot
      },
      'operations:::system-health-checked'
    );

    return result;
  }

  private findBreaches(snapshot: Awaited<ReturnType<SystemHealthProbePort['collect']>>): SystemHealthBreach[] {
    return [
      this.comparePercent('cpu', snapshot.cpu.usagePercent, this.config.thresholds.cpu),
      this.comparePercent('memory', snapshot.memory.usagePercent, this.config.thresholds.memory),
      this.comparePercent('disk', snapshot.disk.usagePercent, this.config.thresholds.disk),
      this.compareMb('process-memory', snapshot.process.rssMb, this.config.thresholds.processMemoryMb)
    ].filter((breach): breach is SystemHealthBreach => breach !== null);
  }

  private comparePercent(
    metric: 'cpu' | 'memory' | 'disk',
    value: number,
    threshold: { warning: number; critical: number }
  ): SystemHealthBreach | null {
    const severity = this.resolveSeverity(value, threshold);
    if (!severity) return null;
    return {
      metric,
      severity,
      value: this.round(value),
      threshold: threshold[severity],
      unit: '%'
    };
  }

  private compareMb(
    metric: 'process-memory',
    value: number,
    threshold: { warning: number; critical: number }
  ): SystemHealthBreach | null {
    const severity = this.resolveSeverity(value, threshold);
    if (!severity) return null;
    return {
      metric,
      severity,
      value: this.round(value),
      threshold: threshold[severity],
      unit: 'MB'
    };
  }

  private resolveSeverity(
    value: number,
    threshold: { warning: number; critical: number }
  ): SystemHealthSeverity | null {
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return null;
  }

  private async filterSendableBreaches(breaches: SystemHealthBreach[]): Promise<SystemHealthBreach[]> {
    const sendable: SystemHealthBreach[] = [];

    for (const breach of breaches) {
      const state = await this.cacheManager.get<AlertState>(this.alertCacheKey(breach));
      const shouldSend = !state || (state.severity === 'warning' && breach.severity === 'critical');
      if (shouldSend) {
        sendable.push(breach);
      }
    }

    return sendable;
  }

  private async markAlertsSent(breaches: SystemHealthBreach[]): Promise<void> {
    const sentAt = new Date().toISOString();

    await Promise.all(
      breaches.map((breach) =>
        this.cacheManager.set<AlertState>(
          this.alertCacheKey(breach),
          {
            severity: breach.severity,
            sentAt,
            value: breach.value
          },
          { ttlSeconds: this.config.alertCooldownSeconds }
        )
      )
    );
  }

  private async sendAlertEmail(
    snapshot: Awaited<ReturnType<SystemHealthProbePort['collect']>>,
    breaches: SystemHealthBreach[]
  ): Promise<void> {
    const highestSeverity = breaches.some((breach) => breach.severity === 'critical') ? 'critical' : 'warning';

    await this.emailSender.sendEmail({
      toAddresses: this.config.adminEmails,
      subject: `[${highestSeverity.toUpperCase()}] System health alert`,
      template: {
        name: 'system-health-alert',
        variables: {
          severity: highestSeverity.toUpperCase(),
          checkedAt: snapshot.checkedAt,
          hostname: snapshot.hostname,
          platform: snapshot.platform,
          uptime: `${Math.round(snapshot.uptimeSeconds / 60)} minutes`,
          diskPath: snapshot.disk.path,
          diskMount: snapshot.disk.mount,
          cpuUsage: `${this.round(snapshot.cpu.usagePercent)}%`,
          memoryUsage: `${this.round(snapshot.memory.usagePercent)}%`,
          diskUsage: `${this.round(snapshot.disk.usagePercent)}%`,
          processMemory: `${this.round(snapshot.process.rssMb)} MB`,
          networkInterface: snapshot.network.iface ?? 'unknown',
          networkRx: `${this.bytesPerSecondToMb(snapshot.network.rxBytesPerSecond)} MB/s`,
          networkTx: `${this.bytesPerSecondToMb(snapshot.network.txBytesPerSecond)} MB/s`,
          breachRows: this.renderBreachRows(breaches)
        }
      }
    });
  }

  private renderBreachRows(breaches: SystemHealthBreach[]): string {
    return breaches
      .map(
        (breach) => `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${breach.metric}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${breach.severity.toUpperCase()}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${breach.value}${breach.unit}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${breach.threshold}${breach.unit}</td>
          </tr>
        `
      )
      .join('');
  }

  private alertCacheKey(breach: SystemHealthBreach): string {
    return `${ALERT_CACHE_KEY_PREFIX}:${breach.metric}`;
  }

  private bytesPerSecondToMb(value: number): number {
    return this.round(value / 1024 / 1024);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
