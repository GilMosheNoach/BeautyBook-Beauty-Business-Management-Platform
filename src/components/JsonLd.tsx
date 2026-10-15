/** Structured data for Google (schema.org), rendered as a JSON-LD script tag. */
export function JsonLd({ data }: { data: object }) {
  // "<" is escaped so text the owner typed can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
