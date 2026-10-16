import { describe, expect, it } from "vitest";
import { z } from "@/lib/zod";

describe("validation messages", () => {
  it("are in Hebrew even without a custom message", () => {
    const res = z.object({ name: z.string().max(80) }).safeParse({ name: "א".repeat(81) });
    expect(res.success).toBe(false);
    expect(res.error!.issues[0].message).toMatch(/[א-ת]/);
  });
});
