declare module "*.css";

declare module "*.mdx" {
  import type { ComponentType } from "react";
  const MDXComponent: ComponentType;
  export default MDXComponent;
}

interface Window {
  dataLayer?: (Record<string, unknown> | IArguments)[];
}
