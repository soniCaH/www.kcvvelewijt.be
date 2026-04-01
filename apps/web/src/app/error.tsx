"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

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
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-kcvv-green-bright text-white font-medium rounded-lg hover:bg-kcvv-green transition-colors"
          >
            <RefreshCcw className="w-5 h-5 mr-2" aria-hidden="true" />
            Probeer opnieuw
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-kcvv-gray-light text-kcvv-gray-dark font-medium rounded-lg hover:bg-kcvv-green-bright/5 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" aria-hidden="true" />
            Naar home
          </Link>
        </div>
      </div>
    </div>
  );
}
