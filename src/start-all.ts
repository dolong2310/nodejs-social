/**
 * Runs the API process and the worker process side by side in one container, for hosts that only allow a
 * single service (e.g. a free Render web service). Each process keeps its own entry point and composition root.
 *
 * - Forwards SIGTERM/SIGINT to both processes so each one shuts down gracefully.
 * - If one process exits on its own, stops the other and exits with an error code so the host restarts both.
 *
 * Runs the compiled entry points next to this file (dist/main.mjs, dist/worker.mjs).
 */
import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = path.dirname(fileURLToPath(import.meta.url));

const PROCESSES = [
  { name: 'api', entry: 'main.mjs' },
  { name: 'worker', entry: 'worker.mjs' }
];

let shuttingDown = false;
let exitCode = 0;

const children: { name: string; child: ChildProcess }[] = PROCESSES.map(({ name, entry }) => {
  // Children inherit process.env, including variables loaded with --env-file on this process.
  const child = spawn(process.execPath, [path.join(distDir, entry)], { stdio: 'inherit', env: process.env });
  child.on('exit', (code, signal) => onChildExit(name, code, signal));
  return { name, child };
});

function isRunning(child: ChildProcess): boolean {
  return child.exitCode === null && child.signalCode === null;
}

function stopAll(signal: NodeJS.Signals): void {
  for (const { child } of children) {
    if (isRunning(child)) child.kill(signal);
  }
}

function onChildExit(name: string, code: number | null, signal: NodeJS.Signals | null): void {
  if (!shuttingDown) {
    console.error(`[start-all] ${name} exited unexpectedly (code=${code}, signal=${signal}), stopping the others`);
    shuttingDown = true;
    exitCode = code || 1;
    stopAll('SIGTERM');
  }
  if (children.every(({ child }) => !isRunning(child))) {
    process.exit(exitCode);
  }
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopAll(signal);
  });
}
