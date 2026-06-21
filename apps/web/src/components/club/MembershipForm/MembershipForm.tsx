"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  EMAIL_PATTERN,
  MEDICAL_CERT_ROLES,
  type MembershipRole,
} from "@kcvv/api-contract";
import {
  Button,
  ClippedCard,
  Input,
  Label,
  Select,
  StampBadge,
} from "@/components/design-system";
import { trackEvent } from "@/lib/analytics/track-event";
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

type SubmitState = "idle" | "submitting" | "success" | "error";

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
        <span className="text-ink text-[length:var(--text-body-sm)] leading-snug">
          {children}
        </span>
      </label>
      {error ? (
        <p className="text-alert mt-1 text-[length:var(--text-body-sm)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MembershipForm({
  defaultRole = "",
  defaultBirthDate = "",
}: MembershipFormProps) {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const [role, setRole] = useState<MembershipRole | "">(defaultRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(defaultBirthDate);
  const [gender, setGender] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [email, setEmail] = useState("");
  const [priorClub, setPriorClub] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentalConsent, setParentalConsent] = useState(false);
  const [medicalCertAcknowledged, setMedicalCertAcknowledged] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const [state, setState] = useState<SubmitState>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

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
      setState("error");
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
        setState("success");
        return;
      }

      if (response.status === 400 && data.fields) {
        setFieldErrors(data.fields);
      }
      setGeneralError(
        data.error ??
          "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
      );
      setState("error");
    } catch {
      setGeneralError(
        "Verzenden mislukt. Controleer je internetverbinding en probeer opnieuw.",
      );
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <ClippedCard as="section">
        <StampBadge tone="jersey" rotation={-2} position="top-right">
          ✓ ONTVANGEN
        </StampBadge>
        <h2 className="font-display mb-3 text-[32px] leading-[1.05] font-black">
          Bedankt voor je inschrijving!
        </h2>
        <p className="text-ink-soft text-[length:var(--text-body-md)]">
          We hebben je inschrijving goed ontvangen en sturen je een
          bevestigingsmail. Iemand van de club neemt binnenkort contact op.
        </p>
      </ClippedCard>
    );
  }

  return (
    <ClippedCard as="section">
      <StampBadge tone="jersey" rotation={2} position="top-right">
        ★ WORD LID
      </StampBadge>

      <form onSubmit={handleSubmit} noValidate>
        <div className="text-ink-muted border-paper-edge mb-6 flex items-center justify-between border-b pb-2 font-mono text-[11px] tracking-[0.08em] uppercase">
          <span>Inschrijfformulier · KCVV Elewijt</span>
        </div>

        <h2 className="font-display mb-6 text-[40px] leading-[1.05] font-black">
          Welkom bij de club.
        </h2>

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
            Ik wil me inschrijven als
          </Label>
          <Select
            id={fieldId("role")}
            name="role"
            value={role}
            placeholder="Maak een keuze…"
            error={fieldErrors.role}
            onChange={(e) => setRole(e.target.value as MembershipRole)}
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
              onChange={(e) => setFirstName(e.target.value)}
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
              onChange={(e) => setLastName(e.target.value)}
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
              onChange={(e) => setBirthDate(e.target.value)}
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
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="m">Man</option>
              <option value="f">Vrouw</option>
              <option value="x">X</option>
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
              onChange={(e) => setMunicipality(e.target.value)}
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPriorClub(e.target.value)}
              error={fieldErrors.priorClub}
            />
          </div>
        </div>

        {isPlayer ? (
          <div className="mt-6">
            <CheckboxField
              id={fieldId("medical")}
              checked={medicalCertAcknowledged}
              onChange={setMedicalCertAcknowledged}
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
                onChange={(e) => setParentEmail(e.target.value)}
                error={fieldErrors.parentEmail}
                autoComplete="email"
              />
            </div>
            <CheckboxField
              id={fieldId("parentalConsent")}
              checked={parentalConsent}
              onChange={setParentalConsent}
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
            onChange={setPrivacyAccepted}
            error={fieldErrors.privacyAccepted}
          >
            Ik aanvaard de{" "}
            <a href="/privacy" className="prose-link underline" target="_blank">
              privacyverklaring
            </a>
            .
          </CheckboxField>
        </div>

        <TurnstileWidget onToken={setTurnstileToken} />

        {generalError ? (
          <p className="text-alert mt-5 text-[length:var(--text-body-md)]">
            {generalError}
          </p>
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
          >
            Inschrijven
          </Button>
        </div>
      </form>
    </ClippedCard>
  );
}
