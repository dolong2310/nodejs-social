import type { Umzug } from 'umzug';

type Disconnectable = {
  disconnect(): Promise<void>;
};

function stripAppArgs(argv: string[]): string[] {
  const result: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--env') {
      index += 1;
      continue;
    }
    if (arg.startsWith('--env=')) continue;
    result.push(arg);
  }

  return result;
}

export async function runMigrationCli<Context extends object>(
  umzug: Umzug<Context>,
  database: Disconnectable
): Promise<void> {
  try {
    await umzug.runAsCLI(stripAppArgs(process.argv.slice(2)));
  } finally {
    await database.disconnect();
  }
}
