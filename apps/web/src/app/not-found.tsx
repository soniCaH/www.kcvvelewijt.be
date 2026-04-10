import { CircleHelp, Home } from "lucide-react";
import { LinkButton } from "@/components/design-system";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <CircleHelp
            className="w-24 h-24 mx-auto text-kcvv-gray opacity-50"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <h1 className="text-3xl font-bold text-kcvv-gray-dark mb-4">
          Pagina niet gevonden
        </h1>

        <p className="text-kcvv-gray mb-8">
          De pagina die je zoekt bestaat niet of is verplaatst. Controleer de
          URL of keer terug naar de homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LinkButton href="/" size="lg">
            <Home className="w-5 h-5" aria-hidden="true" />
            Naar home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
