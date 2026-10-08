export type EnvType = 'string' | 'number' | 'integer' | 'boolean' | 'url' | 'email' | 'port' | 'enum' | 'json';

interface BaseSpec {
  required?: boolean;
  description?: string;
  /** Value written to .env.example (falls back to `default`). */
  example?: unknown;
  /** Hide the received value in error messages. Defaults to true for names like *_SECRET, *_TOKEN, *PASSWORD*, *API_KEY*. */
  secret?: boolean;
}

export interface StringSpec extends BaseSpec { type: 'string' | 'url' | 'email'; default?: string }
export interface NumberSpec extends BaseSpec { type: 'number' | 'integer'; default?: number | string; min?: number; max?: number }
export interface PortSpec extends BaseSpec { type: 'port'; default?: number | string }
export interface BooleanSpec extends BaseSpec { type: 'boolean'; default?: boolean | string }
export interface EnumSpec<V extends string = string> extends BaseSpec { type: 'enum'; values: readonly V[]; default?: V }
export interface JsonSpec extends BaseSpec { type: 'json'; default?: unknown }

export type VarSpec = StringSpec | NumberSpec | PortSpec | BooleanSpec | EnumSpec | JsonSpec;
export type Schema = Record<string, VarSpec>;

type BaseValue<S> =
  S extends { type: 'number' | 'integer' | 'port' } ? number :
  S extends { type: 'boolean' } ? boolean :
  S extends { type: 'enum'; values: readonly (infer V)[] } ? V :
  S extends { type: 'json' } ? unknown :
  string;

type IsSet<S> = S extends { required: true } ? true : S extends { default: {} } ? true : false;

export type Config<S extends Schema> = {
  [K in keyof S]: IsSet<S[K]> extends true ? BaseValue<S[K]> : BaseValue<S[K]> | undefined;
};

export interface EnvError {
  key: string;
  type: string;
  message: string;
  value?: string;
  description?: string;
}

export interface CheckEnvOptions {
  /** Variables to check. Default: process.env. */
  env?: Record<string, string | undefined>;
  /** Also read this .env file. Real env values win over file values. Missing file is ignored. */
  dotenvPath?: string;
  /** On failure print the errors and call process.exit(1) instead of throwing. Default false. */
  exit?: boolean;
}

export class EnvCheckError extends Error {
  readonly errors: EnvError[];
}

export const types: EnvType[];

export function checkEnv<const S extends Schema>(schema: S, options?: CheckEnvOptions): Config<S>;
export function validateEnv<const S extends Schema>(schema: S, env?: Record<string, string | undefined>): { config: Partial<Config<S>>; errors: EnvError[] };
export function formatErrors(errors: EnvError[]): string;
export function parseDotenv(src: string): Record<string, string>;
export function loadDotenv(path?: string): Record<string, string>;
export function generateExample(schema: Schema): string;
export default checkEnv;
