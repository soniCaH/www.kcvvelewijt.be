import type { JsonLdObject, WithContext } from "schema-dts";

interface JsonLdProps<T extends JsonLdObject> {
  data: WithContext<T>;
}

export function JsonLd<T extends JsonLdObject>({ data }: JsonLdProps<T>) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
