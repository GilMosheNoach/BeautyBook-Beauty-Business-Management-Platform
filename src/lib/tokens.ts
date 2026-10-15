import { randomBytes } from "node:crypto";

export function newToken(bytes = 16) {
  return randomBytes(bytes).toString("base64url");
}
