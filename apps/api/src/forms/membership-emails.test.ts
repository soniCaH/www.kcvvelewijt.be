import { describe, it, expect } from "vitest";
import type { MembershipRequest } from "@kcvv/api-contract";
import { buildMembershipEmails } from "./membership-emails";

const payload = {
  role: "vrijwilliger",
  firstName: "Jan",
  lastName: "Peeters",
  birthDate: "1990-06-15",
  gender: "m",
  municipality: "Elewijt",
  email: "jan@example.com",
  privacyAccepted: true,
  turnstileToken: "tok",
} as MembershipRequest;

function build(remark?: string) {
  const [applicant, admin] = buildMembershipEmails({
    payload: { ...payload, remark } as MembershipRequest,
    isMinor: false,
    adminRecipient: "bestuur@example.com",
  });
  return { applicant: applicant!.html, admin: admin!.html };
}

describe("buildMembershipEmails — remark", () => {
  it("shows the remark, HTML-escaped, in the club mail", () => {
    const { admin } = build('Kan <b>enkel</b> op "woensdag"');
    expect(admin).toContain("Opmerking");
    expect(admin).toContain(
      "Kan &lt;b&gt;enkel&lt;/b&gt; op &quot;woensdag&quot;",
    );
    expect(admin).not.toContain("<b>enkel</b>");
  });

  it("keeps the remark's line breaks in the club mail", () => {
    expect(build("regel 1\nregel 2").admin).toContain("regel 1<br>regel 2");
  });

  it("shows no remark row when there is no remark", () => {
    expect(build().admin).not.toContain("Opmerking");
  });

  it("never echoes the remark to the applicant", () => {
    const { applicant } = build("Geheime opmerking");
    expect(applicant).not.toContain("Geheime opmerking");
    expect(applicant).not.toContain("Opmerking");
  });
});

describe("buildMembershipEmails — interesse copy", () => {
  const minor = {
    ...payload,
    parentEmail: "ouder@example.com",
    parentalConsent: true,
  } as MembershipRequest;

  it("uses the interesse subjects for an adult (applicant + admin)", () => {
    const [applicant, admin, ...rest] = buildMembershipEmails({
      payload,
      isMinor: false,
      adminRecipient: "bestuur@example.com",
    });
    expect(rest).toHaveLength(0);
    expect(applicant!.subject).toBe(
      "Bedankt voor je interesse in KCVV Elewijt",
    );
    expect(admin!.subject).toBe("Nieuwe interesse: Jan Peeters (Vrijwilliger)");
  });

  it("uses the interesse subjects for a minor (applicant + parent + admin)", () => {
    const [applicant, parent, admin] = buildMembershipEmails({
      payload: minor,
      isMinor: true,
      adminRecipient: "bestuur@example.com",
    });
    expect(applicant!.subject).toBe(
      "Bedankt voor je interesse in KCVV Elewijt",
    );
    expect(parent!.subject).toBe("Interesse van Jan Peeters in KCVV Elewijt");
    expect(admin!.subject).toBe("Nieuwe interesse: Jan Peeters (Vrijwilliger)");
  });

  it("never says inschrijving in any subject, html or text", () => {
    for (const m of buildMembershipEmails({
      payload: minor,
      isMinor: true,
      adminRecipient: "bestuur@example.com",
    })) {
      expect(`${m.subject} ${m.html} ${m.text}`).not.toMatch(/inschrijv/i);
    }
  });

  it("sends an explicit plain-text part with one Label: value per line", () => {
    const [, admin] = buildMembershipEmails({
      payload: { ...payload, remark: "regel 1\nregel 2" } as MembershipRequest,
      isMinor: false,
      adminRecipient: "bestuur@example.com",
    });
    const lines = admin!.text.split("\n");
    expect(lines).toContain("Rol: Vrijwilliger");
    expect(lines).toContain("Naam: Jan Peeters");
    expect(lines).toContain("E-mail: jan@example.com");
    expect(admin!.text).toContain("Opmerking: regel 1\nregel 2");
  });

  it("gives the applicant and parent a plain-text part naming the role", () => {
    const [applicant, parent] = buildMembershipEmails({
      payload: minor,
      isMinor: true,
      adminRecipient: "bestuur@example.com",
    });
    expect(applicant!.text).toContain("interesse als Vrijwilliger");
    expect(parent!.text).toContain("Jan Peeters");
    expect(parent!.text).not.toContain("<");
  });
});
