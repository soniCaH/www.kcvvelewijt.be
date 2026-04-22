"use client";

import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/design-system";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <AlertTriangle
            className="text-kcvv-gray mx-auto h-24 w-24 opacity-50"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <h1 className="text-kcvv-gray-dark mb-4 text-3xl font-bold">
          Er ging iets mis
        </h1>

        <p className="text-kcvv-gray mb-8">
          Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te
          laden of keer terug naar de homepage.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button type="button" onClick={reset} size="lg">
            <RefreshCcw className="h-5 w-5" aria-hidden="true" />
            Probeer opnieuw
          </Button>

          <LinkButton href="/" size="lg" variant="ghost">
            <Home className="h-5 w-5" aria-hidden="true" />
            Naar home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
