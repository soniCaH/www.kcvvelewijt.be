"use client";

/**
 * AnswerCard — Detail view for a single ResponsibilityPath
 *
 * Header (category badge + question + summary), two-column layout with
 * a single ContactCard on the left and numbered solution steps on the
 * right, and a "back to overview" button at the top.
 *
 * The legacy answer view repeated the contact info per step. The new
 * design intentionally shows ONE contact, never repeated — see the
 * project plan for rationale.
 */

import { ChevronLeft } from "@/lib/icons";
import type { ResponsibilityPath } from "@/types/responsibility";
import { CATEGORY_META } from "./categoryMeta";
import { ContactCard } from "./ContactCard";
import { resolveContact } from "./resolveContact";

export interface AnswerCardProps {
  path: ResponsibilityPath;
  onBackClick: () => void;
  /** Fired when the user clicks the email/phone link inside the contact card */
  onContactClick?: (channel: "email" | "phone") => void;
  /** Fired when the user clicks an inline link inside a step description */
  onStepLinkClick?: (stepIndex: number) => void;
}

export function AnswerCard({
  path,
  onBackClick,
  onContactClick,
  onStepLinkClick,
}: AnswerCardProps) {
  const meta = CATEGORY_META[path.category];
  const Icon = meta.icon;
  const contact = resolveContact(path.primaryContact);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <button
        type="button"
        onClick={onBackClick}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-gray hover:text-kcvv-black"
      >
        <ChevronLeft className="h-4 w-4" />
        Terug naar overzicht
      </button>

      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm bg-white shadow-sm ${meta.color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div
            className={`text-xs font-bold uppercase tracking-[0.15em] ${meta.color}`}
          >
            {meta.label}
          </div>
          <h2 className="mt-1 font-title text-3xl font-black uppercase leading-tight text-kcvv-black md:text-4xl">
            {path.question}
          </h2>
          <p className="mt-2 text-base text-kcvv-gray">{path.summary}</p>
        </div>
      </div>

      {/* Two-column: contact + steps */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
        <ContactCard contact={contact} onContactClick={onContactClick} />

        <div>
          <div className="mb-4 text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-gray">
            Wat te doen
          </div>
          <ol className="space-y-3">
            {path.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kcvv-green-bright font-title text-sm font-black text-kcvv-black">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-kcvv-black">
                  {step.description}
                  {step.link && (
                    <>
                      {" "}
                      <a
                        href={step.link}
                        onClick={() => onStepLinkClick?.(i)}
                        className="text-kcvv-green-dark underline hover:text-kcvv-green-bright"
                        target={
                          step.link.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          step.link.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        Meer info
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
