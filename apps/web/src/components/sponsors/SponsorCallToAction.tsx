/**
 * SponsorCallToAction Component
 * Encourages businesses to become sponsors with contact information
 */

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SponsorCallToActionProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SponsorCallToAction = ({
  className,
}: SponsorCallToActionProps) => {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-kcvv-green-bright to-kcvv-green text-white py-16 px-6 my-12 rounded-lg",
        className,
      )}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Word sponsor van KCVV Elewijt
        </h2>
        <p className="text-xl md:text-2xl mb-8 text-white/90">
          Steun onze club en versterk uw zichtbaarheid in de regio
        </p>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-semibold mb-6">
            Voordelen voor sponsors
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold text-lg mb-2">Zichtbaarheid</h4>
              <p className="text-white/80">
                Uw logo prominent aanwezig op onze website en aan onze
                accommodatie
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">🤝</div>
              <h4 className="font-semibold text-lg mb-2">
                Lokale betrokkenheid
              </h4>
              <p className="text-white/80">
                Toon uw engagement voor sport en jeugd in de gemeenschap
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">📈</div>
              <h4 className="font-semibold text-lg mb-2">Naamsbekendheid</h4>
              <p className="text-white/80">
                Bereik honderden bezoekers en supporters tijdens wedstrijden en
                evenementen
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-lg text-white/90">
            Interesse om sponsor te worden? Neem contact op met onze
            sponsorverantwoordelijke.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:sponsor@kcvvelewijt.be"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-kcvv-green-bright rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact opnemen
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Meer informatie
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
