import type { MembershipRequest, MembershipRole } from "@kcvv/api-contract";
import type { EmailMessage } from "../email/resend";

const ROLE_LABELS: Record<MembershipRole, string> = {
  speler: "Speler",
  jeugdspeler: "Jeugdspeler",
  vrijwilliger: "Vrijwilliger",
  trainer: "Trainer",
  scheidsrechter: "Scheidsrechter",
};

const GENDER_LABELS: Record<string, string> = {
  m: "Man",
  f: "Vrouw",
  x: "X",
};

/** Minimal escaping for the user-supplied strings we interpolate into HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(title: string, body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;line-height:1.5">
  <h1 style="font-size:18px;color:#005c2e">${title}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
  <p style="font-size:12px;color:#888">KCVV Elewijt · Driesstraat 32, 1982 Elewijt · <a href="https://www.kcvvelewijt.be">kcvvelewijt.be</a></p>
</div>`;
}

function applicantHtml(payload: MembershipRequest): string {
  return shell(
    "Bedankt voor je inschrijving!",
    `<p>Beste ${esc(payload.firstName)},</p>
     <p>We hebben je inschrijving als <strong>${ROLE_LABELS[payload.role]}</strong> goed ontvangen.
        Iemand van de club neemt binnenkort contact met je op.</p>
     <p>Er is maar één plezante compagnie. Tot snel!</p>`,
  );
}

function parentHtml(payload: MembershipRequest): string {
  return shell(
    "Inschrijving ontvangen",
    `<p>Beste ouder/voogd,</p>
     <p>We hebben de inschrijving van <strong>${esc(payload.firstName)} ${esc(payload.lastName)}</strong>
        als <strong>${ROLE_LABELS[payload.role]}</strong> bij KCVV Elewijt ontvangen, met jouw toestemming.
        Iemand van de club neemt binnenkort contact op.</p>`,
  );
}

function adminHtml(payload: MembershipRequest, isMinor: boolean): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td style="padding:4px 0"><strong>${value}</strong></td></tr>`;
  return shell(
    "Nieuwe inschrijving via de website",
    `<table style="border-collapse:collapse;font-size:14px">
       ${row("Rol", ROLE_LABELS[payload.role])}
       ${row("Naam", `${esc(payload.firstName)} ${esc(payload.lastName)}`)}
       ${row("Geboortedatum", `${esc(payload.birthDate)}${isMinor ? " (minderjarig)" : ""}`)}
       ${row("Geslacht", GENDER_LABELS[payload.gender] ?? esc(payload.gender))}
       ${row("Gemeente", esc(payload.municipality))}
       ${row("E-mail", esc(payload.email))}
       ${payload.priorClub ? row("Vorige club", esc(payload.priorClub)) : ""}
       ${isMinor && payload.parentEmail ? row("Ouder/voogd e-mail", esc(payload.parentEmail)) : ""}
     </table>
     <p style="font-size:13px;color:#888">Beheer deze inschrijving in Sanity Studio (Inschrijvingen).</p>`,
  );
}

/**
 * Membership-specific email templates. Produces the messages the BFF hands to
 * the form-agnostic {@link EmailMessage} transport: applicant acknowledgment,
 * parent acknowledgment (minors), and the admin notification.
 */
export function buildMembershipEmails(input: {
  payload: MembershipRequest;
  isMinor: boolean;
  adminRecipient: string;
}): EmailMessage[] {
  const { payload, isMinor, adminRecipient } = input;
  const fullName = `${payload.firstName} ${payload.lastName}`;

  const messages: EmailMessage[] = [
    {
      to: payload.email,
      subject: "Bedankt voor je inschrijving bij KCVV Elewijt",
      html: applicantHtml(payload),
    },
  ];

  if (isMinor && payload.parentEmail) {
    messages.push({
      to: payload.parentEmail,
      subject: `Inschrijving ${fullName} bij KCVV Elewijt`,
      html: parentHtml(payload),
    });
  }

  messages.push({
    to: adminRecipient,
    subject: `Nieuwe inschrijving: ${fullName} (${ROLE_LABELS[payload.role]})`,
    html: adminHtml(payload, isMinor),
    replyTo: payload.email,
  });

  return messages;
}
