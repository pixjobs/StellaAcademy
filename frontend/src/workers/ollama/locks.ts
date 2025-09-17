/* eslint-disable no-console */

/**
 * @file locks.ts
 * @description Implements a distributed locking mechanism using Redis.
 * This is crucial for preventing race conditions when multiple workers might try to
 * perform the same non-idempotent operation, such as generating a daily mission.
 */

import type { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

const DEBUG = process.env.DEBUG_LOCKS === '1';
const log = (...args: unknown[]) => { if (DEBUG) console.log('[lock]', ...args); };

/**
 * A client for acquiring and releasing distributed locks.
 */
export class Locker {
  private redis: Redis;
  private token: string;

  constructor(redis: Redis) {
    this.redis = redis;
    // A unique token for this locker instance to ensure we only release locks we own.
    this.token = randomBytes(16).toString('hex');
  }

  /**
   * Attempts to acquire a lock for a given key.
   *
   * @param key The unique identifier for the lock (e.g., 'lock:mission:daily-epic').
   * @param ttlMs The time-to-live for the lock in milliseconds. This is a safety mechanism
   *              to prevent indefinite locks if a worker crashes.
   * @returns A promise that resolves to `true` if the lock was acquired, `false` otherwise.
   */
  async acquire(key: string, ttlMs: number): Promise<boolean> {
    log(`Attempting to acquire lock for key: ${key} with TTL: ${ttlMs}ms`);

    // --- FIX APPLIED HERE ---
    // The correct order for `redis.set` is `key, value, [expiration_mode, ttl], [condition]`.
    // We specify the millisecond expiration ('PX' with its value) BEFORE the
    // "set if not exists" ('NX') condition.
    const acquired = await this.redis.set(key, this.token, 'PX', ttlMs, 'NX');

    // The 'NX' option makes the `set` command return 'OK' (which ioredis translates to a truthy value)
    // only if the key did not already exist. If the key exists, it does nothing and returns `null`.
    const wasAcquired = acquired !== null;
    if (wasAcquired) {
      log(`Successfully acquired lock for key: ${key}`);
    } else {
      log(`Failed to acquire lock for key: ${key} (already held)`);
    }
    return wasAcquired;
  }

  /**
   * Releases a lock that was previously acquired by this locker instance.
   * It uses a Lua script to ensure the operation is atomic (a "check-and-set").
   * This prevents one worker from releasing a lock that was acquired by another.
   *
   * @param key The unique identifier for the lock to release.
   * @returns A promise that resolves to `true` if the lock was released, `false` otherwise.
   */
  async release(key: string): Promise<boolean> {
    log(`Attempting to release lock for key: ${key}`);
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      // We pass the key and the unique token. The script only deletes the key
      // if its value matches our instance's token.
      const result = await this.redis.eval(script, 1, key, this.token);
      // `eval` will return 1 if the key was deleted, 0 otherwise.
      const wasReleased = result === 1;
      if (wasReleased) {
        log(`Successfully released lock for key: ${key}`);
      } else {
        log(`Failed to release lock for key: ${key} (not owner or expired)`);
      }
      return wasReleased;
    } catch (error) {
      console.error(`[lock] Error releasing lock for key: ${key}`, error);
      return false;
    }
  }
}