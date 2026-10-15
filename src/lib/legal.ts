/**
 * Version of the Terms of Use and Privacy Policy. Stored on the owner's record when she accepts them at signup;
 * bump it (and the "last updated" date on the pages) whenever either text changes materially.
 */
export const TERMS_VERSION = "2026-10-15";
export const TERMS_UPDATED = "15 באוקטובר 2026";

/**
 * Details only the platform operator knows. Each empty value shows on the legal pages as a highlighted
 * "to fill in" marker, so a missing detail is visible instead of silently blank.
 */
export const OPERATOR = {
  legalName: "", // the legal entity: company or licensed dealer name
  companyId: "", // ח.פ. / ע.מ.
  address: "",
  email: "",
  paymentProvider: "", // the card clearing company, e.g. Cardcom / Tranzila / PayPlus / Grow
  hostingProvider: "", // where the servers and database run
  courtDistrict: "", // the court district for disputes, e.g. תל אביב
};
