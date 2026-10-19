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

const FOOTER_TEXT =
  "KCVV Elewijt · Driesstraat 32, 1982 Elewijt · https://www.kcvvelewijt.be";

function shell(title: string, body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;line-height:1.5">
  <h1 style="font-size:18px;color:#005c2e">${title}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
  <p style="font-size:12px;color:#888">KCVV Elewijt · Driesstraat 32, 1982 Elewijt · <a href="https://www.kcvvelewijt.be">kcvvelewijt.be</a></p>
</div>`;
}

function applicantText(payload: MembershipRequest): string {
  return [
    `Beste ${payload.firstName},`,
    "",
    `We hebben je bericht goed ontvangen: je hebt interesse als ${ROLE_LABELS[payload.role]}. Iemand van de club neemt binnenkort contact met je op.`,
    "",
    "Er is maar 1 plezante compagnie. Tot snel!",
    "",
    FOOTER_TEXT,
  ].join("\n");
}

function parentText(payload: MembershipRequest): string {
  return [
    "Beste ouder/voogd,",
    "",
    `We hebben de interesse van ${payload.firstName} ${payload.lastName} als ${ROLE_LABELS[payload.role]} bij KCVV Elewijt ontvangen, met jouw toestemming. Iemand van de club neemt binnenkort contact op.`,
    "",
    FOOTER_TEXT,
  ].join("\n");
}

const REMARK_LABEL = "Opmerking";

/** Raw (unescaped) label/value rows shared by the admin html and text parts. */
function adminRows(
  payload: MembershipRequest,
  isMinor: boolean,
): ReadonlyArray<readonly [label: string, value: string]> {
  return [
    ["Rol", ROLE_LABELS[payload.role]],
    ["Naam", `${payload.firstName} ${payload.lastName}`],
    ["Geboortedatum", `${payload.birthDate}${isMinor ? " (minderjarig)" : ""}`],
    ["Geslacht", GENDER_LABELS[payload.gender] ?? payload.gender],
    ["Gemeente", payload.municipality],
    ["E-mail", payload.email],
    ...(payload.priorClub ? [["Vorige club", payload.priorClub] as const] : []),
    ...(isMinor && payload.parentEmail
      ? [["Ouder/voogd e-mail", payload.parentEmail] as const]
      : []),
    ...(payload.remark ? [[REMARK_LABEL, payload.remark] as const] : []),
  ];
}

function adminText(payload: MembershipRequest, isMinor: boolean): string {
  return [
    "Nieuwe interesse via de website",
    "",
    ...adminRows(payload, isMinor).map(
      ([label, value]) => `${label}: ${value}`,
    ),
    "",
    "Beheer dit in Sanity Studio (Interesse).",
    "",
    FOOTER_TEXT,
  ].join("\n");
}

function applicantHtml(payload: MembershipRequest): string {
  return shell(
    "Bedankt voor je interesse!",
    `<p>Beste ${esc(payload.firstName)},</p>
     <p>We hebben je bericht goed ontvangen: je hebt interesse als <strong>${ROLE_LABELS[payload.role]}</strong>.
        Iemand van de club neemt binnenkort contact met je op.</p>
     <p>Er is maar 1 plezante compagnie. Tot snel!</p>`,
  );
}

function parentHtml(payload: MembershipRequest): string {
  return shell(
    "Interesse ontvangen",
    `<p>Beste ouder/voogd,</p>
     <p>We hebben de interesse van <strong>${esc(payload.firstName)} ${esc(payload.lastName)}</strong>
        als <strong>${ROLE_LABELS[payload.role]}</strong> bij KCVV Elewijt ontvangen, met jouw toestemming.
        Iemand van de club neemt binnenkort contact op.</p>`,
  );
}

function adminHtml(payload: MembershipRequest, isMinor: boolean): string {
  const row = ([label, value]: readonly [string, string]) =>
    label === REMARK_LABEL
      ? `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${label}</td><td style="padding:4px 0;word-break:break-word">${esc(value).replace(/\n/g, "<br>")}</td></tr>`
      : `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${label}</td><td style="padding:4px 0;word-break:break-word"><strong>${esc(value)}</strong></td></tr>`;
  return shell(
    "Nieuwe interesse via de website",
    `<table style="border-collapse:collapse;font-size:14px">
       ${adminRows(payload, isMinor).map(row).join("\n       ")}
     </table>
     <p style="font-size:13px;color:#888">Beheer dit in Sanity Studio (Interesse).</p>`,
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
      subject: "Bedankt voor je interesse in KCVV Elewijt",
      html: applicantHtml(payload),
      text: applicantText(payload),
    },
  ];

  if (isMinor && payload.parentEmail) {
    messages.push({
      to: payload.parentEmail,
      subject: `Interesse van ${fullName} in KCVV Elewijt`,
      html: parentHtml(payload),
      text: parentText(payload),
    });
  }

  messages.push({
    to: adminRecipient,
    subject: `Nieuwe interesse: ${fullName} (${ROLE_LABELS[payload.role]})`,
    html: adminHtml(payload, isMinor),
    text: adminText(payload, isMinor),
    replyTo: payload.email,
  });

  return messages;
}
