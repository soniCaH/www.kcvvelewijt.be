import { ErrorState } from "@/components/design-system";

/**
 * Global 404 page (Phase 8.4). Renders the shared `<ErrorState>` in the chosen
 * "centered" layout with the locked 404 copy + actions (`8e2-copy-locked.md`):
 * a way home plus a search affordance for a lost visitor. Self-contained on
 * cream — the SiteHeader/Footer come from the root layout.
 */
export default function NotFound() {
  return (
    <ErrorState
      code="404"
      codeLine="Fout 404 · pagina niet gevonden"
      pun="Buiten de lijnen"
      body="Deze pagina staat niet (meer) op het veld. Misschien is de link verplaatst of bestaat ze niet meer."
      actions={[
        { label: "Naar de homepage", href: "/", variant: "primary" },
        { label: "Zoeken", href: "/zoeken", variant: "ghost" },
      ]}
    />
  );
}
