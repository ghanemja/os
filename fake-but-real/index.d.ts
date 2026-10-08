export interface Person {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  phone: string;
}

export interface Product {
  name: string;
  price: number;
  currency: 'USD';
}

export interface Address {
  street: string;
  city: string;
  region: string;
  regionCode: string;
  postalCode: string;
  country: string;
  full: string;
}

export interface Review {
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  text: string;
  author: string;
}

export interface DateOptions {
  from?: Date | string | number;
  to?: Date | string | number;
}

export interface DateRangeOptions extends DateOptions {
  minDays?: number;
  maxDays?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  days: number;
}

export interface BioOptions {
  firstName?: string;
  jobTitle?: string;
  company?: string;
  city?: string;
}

export interface Faker {
  readonly seed: number | string;
  /** Float in [0, 1). */
  random(): number;
  /** Integer in [min, max] inclusive. `int(n)` means [0, n]. */
  int(min: number, max?: number): number;
  float(min?: number, max?: number, decimals?: number): number;
  bool(probability?: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  sample<T>(items: readonly T[], count: number): T[];

  firstName(): string;
  lastName(): string;
  fullName(): string;
  person(): Person;
  email(firstName?: string, lastName?: string): string;
  username(firstName?: string, lastName?: string): string;
  /** NANP fictional range, e.g. "(415) 555-0123". */
  phone(): string;

  company(): string;
  jobTitle(): string;
  product(): Product;
  city(): string;
  address(): Address;
  bio(person?: BioOptions): string;
  review(options?: { rating?: 1 | 2 | 3 | 4 | 5 }): Review;
  date(options?: DateOptions): Date;
  dateRange(options?: DateRangeOptions): DateRange;
}

export function createFaker(seed?: number | string): Faker;
export default createFaker;
