// env-check — validate environment variables at startup with clear errors. Zero dependencies.
// The browser-safe parts live in core.js; this file adds the file system and process bits.
import { readFileSync, existsSync } from 'node:fs';
import { parseDotenv, validateEnv, formatErrors, EnvCheckError } from './core.js';

export { parseDotenv, validateEnv, formatErrors, generateExample, EnvCheckError, types } from './core.js';

/** Read and parse a .env file. Returns `{}` if the file does not exist. */
export function loadDotenv(path = '.env') {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path, 'utf8'));
}

/**
 * Validate the environment and return a typed config object.
 * @param {object} schema
 * @param {{ env?: Record<string, string|undefined>, dotenvPath?: string, exit?: boolean }} [options]
 */
export function checkEnv(schema, options = {}) {
  const { env = process.env, dotenvPath, exit = false } = options;
  const merged = dotenvPath ? { ...loadDotenv(dotenvPath), ...env } : env;
  const { config, errors } = validateEnv(schema, merged);
  if (errors.length) {
    if (exit) {
      console.error(formatErrors(errors));
      process.exit(1);
    }
    throw new EnvCheckError(errors);
  }
  return config;
}

export default checkEnv;
