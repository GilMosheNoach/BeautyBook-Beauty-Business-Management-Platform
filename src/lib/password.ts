import { hash, verify } from "@node-rs/argon2";

export function hashPassword(password: string) {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Spends the same time as a real check, so a login for an unknown email is not faster than one with a wrong password. */
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hash("not-a-real-password-just-for-timing");
  await verifyPassword(await dummyHash, password);
}
