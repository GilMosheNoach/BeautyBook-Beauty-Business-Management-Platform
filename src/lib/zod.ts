import { z } from "zod";

// Hebrew default messages, so a validation error without a custom message
// (e.g. "too long") still reaches the user in Hebrew.
z.config(z.locales.he());

export { z };
