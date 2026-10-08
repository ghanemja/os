export type ConfettiShape = 'square' | 'circle' | 'strip';

export interface ConfettiOptions {
  /** Start x in CSS pixels from the viewport's left edge. Default: viewport center. */
  x?: number;
  /** Start y in CSS pixels from the viewport's top edge. Default: viewport center. */
  y?: number;
  /** Start from the center of this element (wins over x/y). */
  origin?: Element | null;
  /** Number of particles. Default 120. */
  count?: number;
  /** Width of the launch cone in degrees (0–360). Default 70. */
  spread?: number;
  /** Launch direction in degrees, 90 = up, 0 = right. Default 90. */
  angle?: number;
  /** Maximum launch speed in px/s. Default 900. */
  velocity?: number;
  /** Gravity multiplier (1 = 1400 px/s²; negative floats up). Default 1. */
  gravity?: number;
  /** Air resistance per second. Default 1.6. */
  drag?: number;
  /** Base particle size in px. Default 9. */
  size?: number;
  /** Total burst length in ms; particles fade over the last 30%. Default 3000. */
  duration?: number;
  /** Any CSS colors. */
  colors?: string[];
  /** Default: all three. */
  shapes?: ConfettiShape[];
  /** z-index of the overlay canvas. Default 2147483647. */
  zIndex?: number;
  /**
   * What to do when the user prefers reduced motion.
   * 'minimal' (default): a few slow, non-spinning particles for a short time.
   * 'skip': draw nothing. 'ignore': play the full animation.
   */
  reducedMotion?: 'minimal' | 'skip' | 'ignore';
  /** Seed for a repeatable burst. */
  seed?: number;
}

export interface Confetti {
  /** Resolves when the burst is done (and the canvas is gone, if it was the last one). */
  (options?: ConfettiOptions): Promise<void>;
  /** Stop all bursts now, remove the canvas and resolve pending promises. */
  reset(): void;
}

export declare const confetti: Confetti;
export default confetti;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  flip: number;
  flipSpeed: number;
  size: number;
  color: string;
  shape: ConfettiShape;
}

export interface ResolvedOptions extends Required<Omit<ConfettiOptions, 'origin' | 'seed'>> {
  seed: number | undefined;
  /** True when the reduced-motion minimal burst is in effect. */
  minimal: boolean;
}

export interface ResolveEnv {
  width?: number;
  height?: number;
  reducedMotion?: boolean;
  rect?: { left: number; top: number; width: number; height: number } | null;
}

export declare const SHAPES: readonly ConfettiShape[];
export declare const DEFAULTS: Readonly<ConfettiOptions>;
/** Pixels per second squared at `gravity: 1`. */
export declare const GRAVITY: number;

export declare function createRng(seed?: number): () => number;
export declare function resolveOptions(options?: ConfettiOptions, env?: ResolveEnv): ResolvedOptions;
export declare function shouldSkip(resolved: ResolvedOptions, env?: ResolveEnv): boolean;
export declare function createParticle(options: ResolvedOptions, rand: () => number): Particle;
export declare function createParticles(options: ResolvedOptions, rand: () => number): Particle[];
export declare function stepParticle(
  particle: Particle,
  dt: number,
  physics?: { gravity?: number; drag?: number },
): Particle;
export declare function opacityAt(elapsed: number, duration: number): number;
export declare function isFinished(particles: Particle[], elapsed: number, duration: number, height?: number): boolean;
export declare function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, alpha: number): void;
