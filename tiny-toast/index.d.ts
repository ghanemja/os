export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick?: (event: Event) => void;
}

export interface ToastOptions {
  /** Default `'info'`. Errors use `role="alert"`; the rest use `role="status"`. */
  type?: ToastType;
  /** Milliseconds before auto-dismiss. `0` or `Infinity` keeps it open. Default `4000`. */
  duration?: number;
  /** Default `'bottom-right'`. */
  position?: ToastPosition;
  /** Show a close button and allow Escape to dismiss. Default `true`. */
  dismissible?: boolean;
  /** Optional action button; the toast is dismissed after `onClick` runs. */
  action?: ToastAction | null;
}

export interface ToastDefaults extends ToastOptions {
  /** Visible toasts per position; extra toasts wait in a queue. Default `3`. */
  max?: number;
}

export interface ToastHandle {
  dismiss(): void;
}

export interface Toast {
  (message: string, options?: ToastOptions): ToastHandle;
  info(message: string, options?: Omit<ToastOptions, 'type'>): ToastHandle;
  success(message: string, options?: Omit<ToastOptions, 'type'>): ToastHandle;
  warning(message: string, options?: Omit<ToastOptions, 'type'>): ToastHandle;
  error(message: string, options?: Omit<ToastOptions, 'type'>): ToastHandle;
  /** Merge new defaults for every later toast; returns the full defaults. */
  configure(defaults: ToastDefaults): Required<ToastDefaults>;
  /** Dismiss every visible and queued toast. */
  dismissAll(): void;
}

export interface Clock {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  now(): number;
}

export interface ToasterEnv {
  document?: Document;
  clock?: Clock;
}

export interface Timer {
  readonly remaining: number;
  readonly running: boolean;
  readonly done: boolean;
  start(): Timer;
  resume(): Timer;
  pause(): Timer;
  cancel(): Timer;
}

export interface Queue<T> {
  readonly visible: T[];
  readonly waiting: T[];
  add(item: T): boolean;
  remove(item: T): T | null;
}

export declare const toast: Toast;
export default toast;

export declare function createToaster(env?: ToasterEnv): Toast;
export declare function mergeOptions(
  defaults: ToastDefaults,
  options?: ToastOptions & { max?: number },
): Required<ToastDefaults>;
export declare function createTimer(callback: () => void, ms: number, clock?: Clock): Timer;
export declare function createQueue<T>(limit?: number | (() => number)): Queue<T>;

export declare const TYPES: readonly ToastType[];
export declare const POSITIONS: readonly ToastPosition[];
export declare const DEFAULTS: Readonly<Required<ToastDefaults>>;
/** The stylesheet injected once into `<head>`. */
export declare const CSS: string;
