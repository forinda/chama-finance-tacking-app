/**
 * Password hashing wrapper.
 *
 * Algorithm: argon2id (chosen per E1 spec — winner of the PHC competition,
 * resistant to both GPU and side-channel attacks).
 *
 * Cost parameters target ~50–100 ms per hash on commodity hardware. If
 * authentication latency becomes a problem, lower `memoryCost`/`timeCost`
 * before considering a different algorithm.
 *
 * `verifyPassword` returns `false` instead of throwing on a malformed hash so
 * the login path can use a single comparison and avoid leaking whether a row
 * existed via a thrown exception.
 */
import argon2 from "argon2"

const options = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 4,
} as const

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, options)
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}
