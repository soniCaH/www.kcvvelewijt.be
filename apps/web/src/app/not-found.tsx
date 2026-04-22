import { CircleHelp, Home } from "lucide-react";
import { LinkButton } from "@/components/design-system";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <CircleHelp
            className="text-kcvv-gray mx-auto h-24 w-24 opacity-50"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <h1 className="text-kcvv-gray-dark mb-4 text-3xl font-bold">
          Pagina niet gevonden
        </h1>

        <p className="text-kcvv-gray mb-8">
          De pagina die je zoekt bestaat niet of is verplaatst. Controleer de
          URL of keer terug naar de homepage.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <LinkButton href="/" size="lg">
            <Home className="h-5 w-5" aria-hidden="true" />
            Naar home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
