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
