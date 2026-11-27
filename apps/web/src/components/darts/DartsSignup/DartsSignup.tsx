"use client";

import { Either, Schema as S } from "effect";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DARTS_TEAM_LIMIT,
  DartsSignupResponse,
  DartsSpotsResponse,
  EMAIL_PATTERN,
  dartsPriceAmount,
  isDartsSignupClosed,
} from "@kcvv/api-contract";
import {
  Button,
  ClippedCard,
  EmptyState,
  Input,
  Label,
  LinkButton,
  SectionHeader,
  Textarea,
} from "@/components/design-system";
import { CheckboxField } from "@/components/club/MembershipForm/MembershipForm";
import { TurnstileWidget } from "@/components/club/MembershipForm/TurnstileWidget";
import darts from "@/data/darts.json";
import { trackEvent } from "@/lib/analytics/track-event";
import { makeFormBodyDecoder } from "@/lib/forms/decode-form-body";
import { scrollIntoViewMotionSafe } from "@/lib/utils/scroll-into-view";

const SUBMIT_URL = "/api/darts";
const SPOTS_URL = "/api/darts/spots";
const decodeBody = makeFormBodyDecoder(DartsSignupResponse);
const decodeSpots = S.decodeUnknownEither(DartsSpotsResponse);
const REQUIRED_MSG = "Verplicht.";

// "invalid" covers client-side validation and a server rejection alike (one
// family, as in the membership form); "transport-error" is the network failure.
type SubmitState =
  "idle" | "submitting" | "success" | "invalid" | "transport-error";

interface Values {
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  remark: string;
  rulesAccepted: boolean;
  paymentAccepted: boolean;
}

const EMPTY: Values = {
  teamName: "",
  captainName: "",
  captainEmail: "",
  captainPhone: "",
  remark: "",
  rulesAccepted: false,
  paymentAccepted: false,
};

type Source = "client" | "server";

const subscribeNever = () => () => {};

/**
 * The `/darts` Inschrijven block (#3812). The page is static, so everything
 * that depends on today's date or on Sanity is decided here, in the browser:
 * the block is gone after the event day, and the spots-left count is fetched
 * once on mount through `/api/darts/spots` (a dynamic route handler: no ISR
 * write). The BFF re-checks both at submit time; this is only the display.
 */
// The server render keeps the block (so `#inschrijven` exists on first paint);
// the browser takes it away once the event day is over.
const useSignupClosed = () =>
  useSyncExternalStore(
    subscribeNever,
    () => isDartsSignupClosed(darts.datum.iso, new Date()),
    () => false,
  );

/** The hero's "Inschrijven" button: gone together with the block it points at. */
export const DartsSignupCta = () => {
  if (useSignupClosed()) return null;
  return (
    <div className="mt-4">
      <LinkButton href="#inschrijven" variant="primary" withArrow>
        Inschrijven
      </LinkButton>
    </div>
  );
};

export const DartsSignup = () => {
  if (useSignupClosed()) return null;
  return (
    <section className="mt-4" id="inschrijven" aria-label="Inschrijven">
      <SectionHeader title="Inschrijven" as="h2" ruled />
      <DartsSignupForm />
    </section>
  );
};

export const DartsSignupForm = () => {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const confirmationRef = useRef<HTMLParagraphElement>(null);

  const [values, setValues] = useState<Values>(EMPTY);
  const startedRef = useRef(false);

  // `undefined` = not known (yet, or the count could not be read): the intro
  // then stays neutral and the BFF still decides spot or wachtlijst on submit.
  const [spotsLeft, setSpotsLeft] = useState<number | undefined>();
  useEffect(() => {
    const controller = new AbortController();
    fetch(SPOTS_URL, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const spots = decodeSpots(data);
        if (Either.isRight(spots)) setSpotsLeft(spots.right.spotsLeft);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  };

  const [state, setState] = useState<SubmitState>("idle");
  const [waitlisted, setWaitlisted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // What just happened, for analytics only. Set where the outcome is known and
  // reported from an effect (a fresh object per outcome), never from the async
  // submit handler, which cannot see derived state.
  const [report, setReport] = useState<
    | { kind: "submit"; waitlist: boolean; hasRemark: boolean }
    | { kind: "error"; errors: Record<string, string>; source: Source }
    | null
  >(null);
  useEffect(() => {
    if (!report) return;
    switch (report.kind) {
      case "submit":
        trackEvent("darts_signup_submit", {
          waitlist: report.waitlist,
          has_remark: report.hasRemark,
        });
        return;
      case "error": {
        // Field names only, never values, sorted so client and server agree.
        const names = Object.keys(report.errors).sort();
        if (names.length === 0) return;
        trackEvent("darts_signup_error", {
          fields: names.join(","),
          source: report.source,
        });
        return;
      }
      default: {
        const unreachable: never = report;
        throw new Error(`Unhandled report: ${JSON.stringify(unreachable)}`);
      }
    }
  }, [report]);

  const setField = <K extends keyof Values>(name: K, value: Values[K]) => {
    // A change that carries the current value is no field change and must not
    // spend the one start event.
    if (!startedRef.current && values[name] !== value) {
      startedRef.current = true;
      trackEvent("darts_signup_start");
    }
    setValues((prev) =>
      prev[name] === value ? prev : { ...prev, [name]: value },
    );
  };

  // The form unmounts on success, so focus would fall to <body>.
  useEffect(() => {
    if (state !== "success") return;
    const note = confirmationRef.current;
    if (!note) return;
    note.focus({ preventScroll: true });
    scrollIntoViewMotionSafe(note, { block: "center" });
  }, [state]);

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!values.teamName.trim()) errors.teamName = REQUIRED_MSG;
    if (!values.captainName.trim()) errors.captainName = REQUIRED_MSG;
    if (!EMAIL_PATTERN.test(values.captainEmail.trim()))
      errors.captainEmail = "Vul een geldig e-mailadres in.";
    if (!values.captainPhone.trim()) errors.captainPhone = REQUIRED_MSG;
    if (!values.rulesAccepted)
      errors.rulesAccepted = "Bevestig dit om verder te gaan.";
    if (!values.paymentAccepted)
      errors.paymentAccepted = "Bevestig dit om verder te gaan.";
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === "submitting") return;

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setReport({ kind: "error", errors: clientErrors, source: "client" });
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
          teamName: values.teamName,
          captainName: values.captainName,
          captainEmail: values.captainEmail,
          captainPhone: values.captainPhone,
          remark: values.remark || undefined,
          rulesAccepted: values.rulesAccepted,
          paymentAccepted: values.paymentAccepted,
          turnstileToken,
          company: honeypot,
        }),
      });

      const { success, refusal } = decodeBody(
        await response.json().catch(() => null),
      );

      if (response.ok && success?.ok) {
        const onWaitlist = success.waitlist;
        setReport({
          kind: "submit",
          waitlist: onWaitlist,
          hasRemark: values.remark.trim() !== "",
        });
        setWaitlisted(onWaitlist);
        setState("success");
        return;
      }

      // `refusal.error` is authored Dutch copy from the BFF, never a raw error.
      if (response.status === 400 && refusal?.fields) {
        setFieldErrors(refusal.fields);
        setReport({ kind: "error", errors: refusal.fields, source: "server" });
      }
      setGeneralError(
        refusal?.error ??
          "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
      );
      resetTurnstile();
      setState("invalid");
    } catch (err) {
      console.error("[DartsSignup] Failed to submit:", err);
      resetTurnstile();
      setState("transport-error");
    }
  };

  if (state === "success") {
    return (
      <ClippedCard className="mt-6">
        <p
          ref={confirmationRef}
          tabIndex={-1}
          className="text-ink text-body-md focus:outline-none"
        >
          {waitlisted
            ? "Jullie staan op de wachtlijst. Komt er een plaats vrij, dan laten we het weten."
            : "Ingeschreven! Kijk in je mailbox: daar staat hoe je betaalt."}
        </p>
      </ClippedCard>
    );
  }

  const full = spotsLeft === 0;
  const intro = (() => {
    if (full)
      return `Alle ${DARTS_TEAM_LIMIT} plaatsen zijn ingenomen. Schrijf je toch in: dan staan jullie op de wachtlijst.`;
    if (spotsLeft === undefined) return "Schrijf je ploeg in.";
    return `Schrijf je ploeg in. Nog ${spotsLeft} van de ${DARTS_TEAM_LIMIT} plaatsen vrij.`;
  })();

  return (
    <ClippedCard className="mt-6">
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-ink text-body-md mb-6">{intro}</p>

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

        <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor={fieldId("teamName")} required>
              Ploegnaam
            </Label>
            <Input
              id={fieldId("teamName")}
              name="teamName"
              maxLength={100}
              value={values.teamName}
              onChange={(e) => setField("teamName", e.target.value)}
              error={fieldErrors.teamName}
              hint="Dit is ook de mededeling bij jullie betaling."
            />
          </div>
          <div>
            <Label htmlFor={fieldId("captainName")} required>
              Naam kapitein
            </Label>
            <Input
              id={fieldId("captainName")}
              name="captainName"
              maxLength={100}
              value={values.captainName}
              onChange={(e) => setField("captainName", e.target.value)}
              error={fieldErrors.captainName}
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor={fieldId("captainPhone")} required>
              Gsm kapitein
            </Label>
            <Input
              id={fieldId("captainPhone")}
              name="captainPhone"
              maxLength={30}
              type="tel"
              value={values.captainPhone}
              onChange={(e) => setField("captainPhone", e.target.value)}
              error={fieldErrors.captainPhone}
              autoComplete="tel"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={fieldId("captainEmail")} required>
              E-mail kapitein
            </Label>
            <Input
              id={fieldId("captainEmail")}
              name="captainEmail"
              type="email"
              value={values.captainEmail}
              onChange={(e) => setField("captainEmail", e.target.value)}
              error={fieldErrors.captainEmail}
              hint="Alle info komt op dit adres."
              autoComplete="email"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <CheckboxField
            id={fieldId("rules")}
            checked={values.rulesAccepted}
            onChange={(checked) => setField("rulesAccepted", checked)}
            error={fieldErrors.rulesAccepted}
          >
            Ik ken het reglement: pijlen met weerhaakjes zijn verboden.
          </CheckboxField>
          <CheckboxField
            id={fieldId("payment")}
            checked={values.paymentAccepted}
            onChange={(checked) => setField("paymentAccepted", checked)}
            error={fieldErrors.paymentAccepted}
          >
            Onze inschrijving is pas definitief als de{" "}
            {dartsPriceAmount(darts.prijs.tekst)} betaald is.
          </CheckboxField>
        </div>

        <div className="mt-6">
          <Label htmlFor={fieldId("remark")}>Opmerking (niet verplicht)</Label>
          <Textarea
            id={fieldId("remark")}
            name="remark"
            rows={3}
            maxLength={1000}
            value={values.remark}
            onChange={(e) => setField("remark", e.target.value)}
            hint="Iets dat we moeten weten?"
          />
        </div>

        <TurnstileWidget
          onToken={setTurnstileToken}
          resetKey={turnstileResetKey}
        />

        <span aria-live="polite" className="sr-only">
          {state === "submitting" ? "Versturen…" : ""}
        </span>

        {generalError ? (
          <p
            role="alert"
            aria-live="assertive"
            className="text-alert text-body-md mt-5"
          >
            {generalError}
          </p>
        ) : null}

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

        <div className="border-paper-edge mt-7 flex justify-end border-t border-dashed pt-4">
          <Button
            variant="secondary"
            withArrow
            type="submit"
            loading={state === "submitting"}
            loadingLabel="Versturen…"
          >
            Schrijf onze ploeg in
          </Button>
        </div>
      </form>
    </ClippedCard>
  );
};
