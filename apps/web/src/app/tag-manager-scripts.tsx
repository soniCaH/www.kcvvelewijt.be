import Script from "next/script";
import { GoogleTagManagerLoader } from "@/components/layout/GoogleTagManagerLoader";

/**
 * The consent default and the GTM container loader. Omitted in preview mode
 * (#3619): an editor looking at unpublished changes must not count as a
 * visitor. With no `dataLayer` created, `trackEvent` stays a no-op, so no
 * GTM or GA4 request leaves the browser.
 */
export const TagManagerScripts = ({
  gtmId,
  preview,
}: {
  gtmId?: string;
  preview: boolean;
}) => {
  if (preview) return null;

  return (
    <>
      <Script id="gtm-consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied','wait_for_update':500});`}
      </Script>
      <GoogleTagManagerLoader gtmId={gtmId} />
    </>
  );
};
