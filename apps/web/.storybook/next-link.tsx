import { forwardRef, type ComponentProps } from "react";
import MockLink from "@storybook/nextjs-vite/link.mock";

export * from "@storybook/nextjs-vite/link.mock";

type LinkProps = ComponentProps<typeof MockLink> & {
  transitionTypes?: string[];
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { transitionTypes: _transitionTypes, ...props },
  ref,
) {
  return <MockLink ref={ref} {...props} />;
});

export default Link;
