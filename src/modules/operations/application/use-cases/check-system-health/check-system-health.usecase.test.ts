import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import type { EmailSenderPort } from '@/modules/core/application/ports/email-sender.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { SystemHealthProbePort } from '@/modules/operations/application/ports/system-health-probe.port';
import { CheckSystemHealthUseCase } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.usecase';
import { mockPort } from '@test/support/mocks/port.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CheckSystemHealthUseCase', () => {
  let probe: SystemHealthProbePort;
  let cacheManager: CacheManagerPort;
  let emailSender: EmailSenderPort;
  let logger: LoggerPort;

  beforeEach(() => {
    probe = mockPort<SystemHealthProbePort>({
      collect: vi.fn().mockResolvedValue({
        checkedAt: '2026-05-21T00:00:00.000Z',
        hostname: 'api-1',
        platform: 'linux 6.1',
        uptimeSeconds: 600,
        cpu: { usagePercent: 95, loadAverage: 1.2, cores: 4 },
        memory: { totalMb: 1024, usedMb: 512, usagePercent: 50 },
        disk: { path: '/', mount: '/', totalGb: 100, usedGb: 30, usagePercent: 30 },
        process: { rssMb: 128, heapUsedMb: 64 },
        network: { iface: 'eth0', rxBytesPerSecond: 1024, txBytesPerSecond: 2048 }
      })
    });
    cacheManager = mockPort<CacheManagerPort>({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined)
    });
    emailSender = mockPort<EmailSenderPort>({
      sendEmail: vi.fn().mockResolvedValue(undefined)
    });
    logger = mockPort<LoggerPort>({
      child: vi.fn().mockReturnThis(),
      info: vi.fn()
    });
  });

  it('sends a template email when a metric breaches threshold', async () => {
    const useCase = buildUseCase();

    const result = await useCase.execute();

    expect(result.status).toBe('breached');
    expect(result.alertsSent).toBe(1);
    expect(emailSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        toAddresses: ['admin@example.com'],
        subject: '[CRITICAL] System health alert',
        template: expect.objectContaining({
          name: 'system-health-alert',
          variables: expect.objectContaining({
            severity: 'CRITICAL',
            hostname: 'api-1',
            cpuUsage: '95%'
          })
        })
      })
    );
    expect(cacheManager.set).toHaveBeenCalledWith(
      'operations:system-health:alert:cpu',
      expect.objectContaining({ severity: 'critical', value: 95 }),
      { ttlSeconds: 1800 }
    );
  });

  it('does not send another warning while alert cooldown is active', async () => {
    vi.mocked(cacheManager.get).mockResolvedValue({
      severity: 'critical',
      sentAt: '2026-05-21T00:00:00.000Z',
      value: 95
    });
    const useCase = buildUseCase();

    const result = await useCase.execute();

    expect(result.status).toBe('breached');
    expect(result.alertsSent).toBe(0);
    expect(emailSender.sendEmail).not.toHaveBeenCalled();
  });

  function buildUseCase(): CheckSystemHealthUseCase {
    return new CheckSystemHealthUseCase(probe, cacheManager, emailSender, logger, {
      adminEmails: ['admin@example.com'],
      alertCooldownSeconds: 1800,
      thresholds: {
        cpu: { warning: 80, critical: 90 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 80, critical: 90 },
        processMemoryMb: { warning: 512, critical: 1024 }
      }
    });
  }
});
