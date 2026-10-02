"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  EMAIL_PATTERN,
  MEDICAL_CERT_ROLES,
  type MembershipRole,
} from "@kcvv/api-contract";
import {
  Button,
  ClippedCard,
  EmptyState,
  Input,
  Label,
  Select,
  Spinner,
  StampBadge,
} from "@/components/design-system";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  clearDraft,
  EMPTY_DRAFT,
  GENDER_OPTIONS,
  isEmptyDraft,
  readDraft,
  writeDraft,
  type MembershipDraft,
} from "./membership-draft";
import { TurnstileWidget } from "./TurnstileWidget";

const ROLE_OPTIONS: { value: MembershipRole; label: string }[] = [
  { value: "speler", label: "Speler" },
  { value: "jeugdspeler", label: "Jeugdspeler" },
  { value: "vrijwilliger", label: "Vrijwilliger" },
  { value: "trainer", label: "Trainer" },
  { value: "scheidsrechter", label: "Scheidsrechter" },
];

const REQUIRED_MSG = "Verplicht.";

/** Minor preview for conditional fields — the BFF recomputes authoritatively. */
function isMinor(birthDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
  const today = new Date();
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age -= 1;
  return age < 18;
}

const SUBMIT_URL = "/api/membership";

interface MembershipFormProps {
  /** Storybook/testing: seed the role to render role-specific fields. */
  defaultRole?: MembershipRole | "";
  /** Storybook/testing: seed the birth date to render the minor flow. */
  defaultBirthDate?: string;
}

// "invalid" covers both client-side validation and a server rejection —
// #2470 rule 6 already treats those as one family (per-field `<AlertBadge>`
// territory). "transport-error" is the one client-initiated failure this
// ticket adds a notice for. Splitting the old bare "error" member this way
// makes the two outcomes mutually exclusive by construction — no separate
// boolean needed alongside it.
type SubmitState =
  "idle" | "submitting" | "success" | "invalid" | "transport-error";

function CheckboxField({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-jersey-deep mt-0.5 size-4 shrink-0 rounded-none"
        />
        <span className="text-ink text-body-sm">{children}</span>
      </label>
      {error ? <p className="text-alert text-body-sm mt-1">{error}</p> : null}
    </div>
  );
}

const subscribeNever = () => () => {};

/**
 * The draft (#3326) is read after hydration, not during the server or the
 * hydrating render, so the two agree. `useSyncExternalStore` serves the
 * server snapshot (`false`) while hydrating and the client one right after:
 * the fields remount once, only when a draft exists, with it as their initial state. A plain
 * client render (Storybook, tests) reads it on the first render.
 */
export function MembershipForm(props: MembershipFormProps) {
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  // Read once, on the first hydrated render: later writes to storage must not
  // flip the key under a visitor who is typing.
  // `undefined` = not read yet; `null` = read, no draft.
  const [draft, setDraft] = useState<MembershipDraft | null>();
  if (hydrated && draft === undefined) setDraft(readDraft());
  // Remount only when there is a draft to start from: a visitor with none
  // keeps the hydrated nodes (focus, typed text, one Turnstile mount).
  return (
    <MembershipFormFields
      key={draft ? "draft" : "base"}
      {...props}
      draft={draft ?? null}
    />
  );
}

function MembershipFormFields({
  defaultRole = "",
  defaultBirthDate = "",
  draft,
}: MembershipFormProps & { draft: MembershipDraft | null }) {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const roleRef = useRef<HTMLSelectElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  // A draft beats `defaultRole` / `defaultBirthDate`: the visitor's own
  // answer beats the link.
  const [values, setValues] = useState<MembershipDraft>(
    () =>
      draft ?? {
        ...EMPTY_DRAFT,
        role: defaultRole,
        birthDate: defaultBirthDate,
      },
  );
  const [draftRestored, setDraftRestored] = useState(draft !== null);
  const {
    role,
    firstName,
    lastName,
    birthDate,
    gender,
    municipality,
    email,
    priorClub,
    parentEmail,
    parentalConsent,
    medicalCertAcknowledged,
    privacyAccepted,
  } = values;

  const setField = <K extends keyof MembershipDraft>(
    name: K,
    value: MembershipDraft[K],
  ) => {
    // Functional, so two changes in one batch (browser autofill) both land.
    setValues((prev) => {
      if (prev[name] === value) return prev;
      const next = { ...prev, [name]: value };
      if (isEmptyDraft(next)) clearDraft();
      else writeDraft(next);
      return next;
    });
  };

  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const [state, setState] = useState<SubmitState>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // The submit button unmounts with the form, so focus would fall to <body>
  // and the confirmation can sit above the viewport on a long form (#3384).
  useEffect(() => {
    if (state !== "success") return;
    const heading = confirmationRef.current;
    if (!heading) return;
    // `preventScroll`: the scroll below is the one that honours reduced motion.
    heading.focus({ preventScroll: true });
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    heading.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
      block: "start",
    });
  }, [state]);

  const clearForm = () => {
    setValues(EMPTY_DRAFT);
    clearDraft();
    setDraftRestored(false);
    setFieldErrors({});
    setGeneralError("");
    setState("idle");
    // The button unmounts with the note, so focus would fall to <body>.
    roleRef.current?.focus();
  };

  const minor = useMemo(() => isMinor(birthDate), [birthDate]);
  const isPlayer = role !== "" && MEDICAL_CERT_ROLES.includes(role);

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!role) errors.role = REQUIRED_MSG;
    if (!firstName.trim()) errors.firstName = REQUIRED_MSG;
    if (!lastName.trim()) errors.lastName = REQUIRED_MSG;
    if (!birthDate) errors.birthDate = REQUIRED_MSG;
    if (!gender) errors.gender = REQUIRED_MSG;
    if (!municipality.trim()) errors.municipality = REQUIRED_MSG;
    if (!EMAIL_PATTERN.test(email))
      errors.email = "Vul een geldig e-mailadres in.";
    if (isPlayer && !medicalCertAcknowledged) {
      errors.medicalCertAcknowledged = "Bevestig dit om verder te gaan.";
    }
    if (minor) {
      if (!EMAIL_PATTERN.test(parentEmail)) {
        errors.parentEmail =
          "Vul een geldig e-mailadres in van een ouder/voogd.";
      }
      if (!parentalConsent) {
        errors.parentalConsent = "Toestemming van een ouder/voogd is vereist.";
      }
    }
    if (!privacyAccepted) {
      errors.privacyAccepted =
        "Aanvaard de privacyverklaring om verder te gaan.";
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === "submitting") return;

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setGeneralError("Controleer de gemarkeerde velden.");
      setState("invalid");
      return;
    }

    setState("submitting");
    setFieldErrors({});
    setGeneralError("");

    try {
      const response = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          firstName,
          lastName,
          birthDate,
          gender,
          municipality,
          email,
          priorClub: priorClub || undefined,
          parentEmail: minor ? parentEmail : undefined,
          parentalConsent: minor ? parentalConsent : undefined,
          medicalCertAcknowledged: isPlayer
            ? medicalCertAcknowledged
            : undefined,
          privacyAccepted,
          turnstileToken,
          company: honeypot,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        fields?: Record<string, string>;
        error?: string;
      };

      if (response.ok && data.ok) {
        trackEvent("membership_form_submit", {
          role,
          is_minor: minor,
          has_prior_club: priorClub.trim() !== "",
        });
        clearDraft();
        setState("success");
        return;
      }

      // `data.error` is authored Dutch copy from the BFF/route handler —
      // never a raw caught error — so it must survive; the fallback only
      // covers a body with no `error` at all.
      if (response.status === 400 && data.fields) {
        setFieldErrors(data.fields);
      }
      setGeneralError(
        data.error ??
          "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
      );
      setState("invalid");
    } catch (err) {
      // The caught error goes to the console only — the visitor sees the
      // locked Dutch copy below, never the transport error's own text
      // (#2580 rule 6). The submit button survives this failure (it's still
      // on screen, re-enabled), so no retry action is added (#2580 rule 4).
      console.error("[MembershipForm] Failed to submit:", err);
      setState("transport-error");
    }
  };

  if (state === "success") {
    return (
      <ClippedCard as="section">
        <StampBadge tone="jersey" rotation={-2} position="top-right">
          ✓ ONTVANGEN
        </StampBadge>
        <h2
          ref={confirmationRef}
          tabIndex={-1}
          className="font-display mb-3 text-[32px] leading-[1.05] font-black focus:outline-none"
        >
          Bedankt voor je interesse!
        </h2>
        <p className="text-ink text-body-md">
          We hebben je aanvraag goed ontvangen en sturen je een
          bevestigingsmail. Iemand van de club neemt binnenkort contact op.
        </p>
      </ClippedCard>
    );
  }

  return (
    <ClippedCard as="section">
      <StampBadge tone="jersey" rotation={2} position="top-right">
        ★ INTERESSE
      </StampBadge>

      <form onSubmit={handleSubmit} noValidate>
        <div className="text-ink-muted border-paper-edge mb-6 flex items-center justify-between border-b pb-2 font-mono text-[11px] tracking-[0.08em] uppercase">
          <span>Aanmeldformulier · KCVV Elewijt</span>
        </div>

        <h2 className="font-display mb-6 text-[40px] leading-[1.05] font-black">
          Laat van je horen.
        </h2>

        {draftRestored ? (
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-ink-muted text-body-sm">
              We hebben je ingevulde gegevens bewaard.
            </p>
            <Button variant="ghost" size="sm" type="button" onClick={clearForm}>
              Wis formulier
            </Button>
          </div>
        ) : null}

        {/* Honeypot — visually hidden, off-screen; bots fill it, humans don't. */}
        <div
          aria-hidden
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor={fieldId("company")}>Bedrijf (niet invullen)</label>
          <input
            id={fieldId("company")}
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <Label htmlFor={fieldId("role")} required>
            Ik heb interesse als
          </Label>
          <Select
            ref={roleRef}
            id={fieldId("role")}
            name="role"
            value={role}
            placeholder="Maak een keuze…"
            error={fieldErrors.role}
            onChange={(e) => setField("role", e.target.value as MembershipRole)}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] md:grid-cols-2">
          <div>
            <Label htmlFor={fieldId("firstName")} required>
              Voornaam
            </Label>
            <Input
              id={fieldId("firstName")}
              name="firstName"
              value={firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              error={fieldErrors.firstName}
              autoComplete="given-name"
            />
          </div>
          <div>
            <Label htmlFor={fieldId("lastName")} required>
              Achternaam
            </Label>
            <Input
              id={fieldId("lastName")}
              name="lastName"
              value={lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              error={fieldErrors.lastName}
              autoComplete="family-name"
            />
          </div>
          <div>
            <Label htmlFor={fieldId("birthDate")} required>
              Geboortedatum
            </Label>
            <Input
              id={fieldId("birthDate")}
              name="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setField("birthDate", e.target.value)}
              error={fieldErrors.birthDate}
            />
          </div>
          <div>
            <Label htmlFor={fieldId("gender")} required>
              Geslacht
            </Label>
            <Select
              id={fieldId("gender")}
              name="gender"
              value={gender}
              placeholder="Maak een keuze…"
              error={fieldErrors.gender}
              onChange={(e) => setField("gender", e.target.value)}
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={fieldId("municipality")} required>
              Gemeente
            </Label>
            <Input
              id={fieldId("municipality")}
              name="municipality"
              value={municipality}
              onChange={(e) => setField("municipality", e.target.value)}
              error={fieldErrors.municipality}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <Label htmlFor={fieldId("email")} required>
              E-mail
            </Label>
            <Input
              id={fieldId("email")}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setField("email", e.target.value)}
              error={fieldErrors.email}
              autoComplete="email"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={fieldId("priorClub")} optional>
              Vorige club
            </Label>
            <Input
              id={fieldId("priorClub")}
              name="priorClub"
              value={priorClub}
              onChange={(e) => setField("priorClub", e.target.value)}
              error={fieldErrors.priorClub}
            />
          </div>
        </div>

        {isPlayer ? (
          <div className="mt-6">
            <CheckboxField
              id={fieldId("medical")}
              checked={medicalCertAcknowledged}
              onChange={(checked) =>
                setField("medicalCertAcknowledged", checked)
              }
              error={fieldErrors.medicalCertAcknowledged}
            >
              Ik begrijp dat ik bij de eerste training een medisch attest van
              geneeskundige geschiktheid moet voorleggen.
            </CheckboxField>
          </div>
        ) : null}

        {minor ? (
          <div className="border-paper-edge mt-6 space-y-4 border-l-2 pl-4">
            <p className="text-ink-muted font-mono text-[11px] tracking-[0.08em] uppercase">
              Minderjarig — ouder/voogd vereist
            </p>
            <div>
              <Label htmlFor={fieldId("parentEmail")} required>
                E-mail ouder/voogd
              </Label>
              <Input
                id={fieldId("parentEmail")}
                name="parentEmail"
                type="email"
                value={parentEmail}
                onChange={(e) => setField("parentEmail", e.target.value)}
                error={fieldErrors.parentEmail}
                autoComplete="email"
              />
            </div>
            <CheckboxField
              id={fieldId("parentalConsent")}
              checked={parentalConsent}
              onChange={(checked) => setField("parentalConsent", checked)}
              error={fieldErrors.parentalConsent}
            >
              Ik ben de ouder/voogd en geef toestemming voor deze inschrijving.
            </CheckboxField>
          </div>
        ) : null}

        <div className="mt-6">
          <CheckboxField
            id={fieldId("privacy")}
            checked={privacyAccepted}
            onChange={(checked) => setField("privacyAccepted", checked)}
            error={fieldErrors.privacyAccepted}
          >
            Ik aanvaard de{" "}
            {/* #2547 rule 5 — an internal link never opens a new tab, so a
                plain <a> here (a hard same-tab navigation) is the wrong
                instrument: it unmounts this form and every useState field
                (including the Turnstile token) with it. next/link's
                client-side navigation still unmounts the form on a route
                change — the fields are kept as a per-tab draft (#3326)
                and restored when the visitor comes back. */}
            <Link href="/privacy" className="prose-link underline">
              privacyverklaring
            </Link>
            .
          </CheckboxField>
        </div>

        <TurnstileWidget onToken={setTurnstileToken} />

        {generalError ? (
          <p
            role="alert"
            aria-live="assertive"
            className="text-alert text-body-md mt-5"
          >
            {generalError}
          </p>
        ) : null}

        {/* Tier 2, no action (#2580 rule 4): the submit button below already
            survives this failure, so a second control here would be
            redundant. Replaces the raw `<p role="alert" aria-live="assertive"
            className="text-alert">` this branch used to share with the
            field-validation summary above. */}
        {state === "transport-error" ? (
          <EmptyState
            tier="slot"
            reason="unavailable"
            live
            emphasis={{ text: "mislukt" }}
            className="mt-5"
          >
            Verzenden mislukt. Controleer je internetverbinding en probeer
            opnieuw.
          </EmptyState>
        ) : null}

        <div className="border-paper-edge mt-7 flex items-center justify-between border-t border-dashed pt-4">
          <span className="text-ink-muted font-mono text-[11px] tracking-[0.08em] uppercase">
            {state === "submitting" ? "Versturen…" : "Word lid van KCVV"}
          </span>
          <Button
            variant="secondary"
            withArrow
            type="submit"
            disabled={state === "submitting"}
            // Replaces the name the hidden label would give; the spinner's own
            // label is not part of a button's name.
            aria-label={state === "submitting" ? "Versturen…" : undefined}
            className={
              state === "submitting"
                ? "relative [&>[aria-hidden=true]]:invisible"
                : "relative"
            }
          >
            {/* The label stays in flow, only hidden, so the button keeps its
                width; the arrow is hidden with it and the dots sit on top. */}
            <span className={state === "submitting" ? "invisible" : undefined}>
              Verstuur aanvraag
            </span>
            {state === "submitting" ? (
              <Spinner
                variant="compact"
                label="Versturen…"
                className="absolute inset-0 justify-center"
              />
            ) : null}
          </Button>
        </div>
      </form>
    </ClippedCard>
  );
}
