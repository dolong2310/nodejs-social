import argv from 'minimist';

const envArgs = argv(process.argv.slice(2));

export const isDevelopment = envArgs.development === 'true';
export const isProduction = envArgs.production === 'true';
