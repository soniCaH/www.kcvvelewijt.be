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
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <AlertTriangle
            className="w-24 h-24 mx-auto text-kcvv-gray opacity-50"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <h1 className="text-3xl font-bold text-kcvv-gray-dark mb-4">
          Er ging iets mis
        </h1>

        <p className="text-kcvv-gray mb-8">
          Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te
          laden of keer terug naar de homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button type="button" onClick={reset} size="lg">
            <RefreshCcw className="w-5 h-5" aria-hidden="true" />
            Probeer opnieuw
          </Button>

          <LinkButton href="/" size="lg" variant="ghost">
            <Home className="w-5 h-5" aria-hidden="true" />
            Naar home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
