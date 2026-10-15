// Normalizes Israeli phone numbers to local form (05XXXXXXXX) so one client
// is one row no matter how the number was typed.
export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("972")) digits = "0" + digits.slice(3);
  return digits;
}

export function isValidPhone(input: string) {
  return /^0\d{8,9}$/.test(normalizePhone(input));
}

// wa.me needs the international form without "+".
export function whatsappNumber(phone: string) {
  const local = normalizePhone(phone);
  return local.startsWith("0") ? "972" + local.slice(1) : local;
}
