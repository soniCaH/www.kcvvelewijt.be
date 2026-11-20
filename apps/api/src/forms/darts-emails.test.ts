import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { DartsSignupRequest } from "@kcvv/api-contract";
import darts from "../../../web/src/data/darts.json";
import {
  DARTS_CLUB_EMAIL,
  buildDartsPaidEmail,
  buildDartsSignupEmails,
  formatEventDay,
} from "./darts-emails";

const payload = S.decodeUnknownSync(DartsSignupRequest)({
  teamName: "De Pijlenjagers",
  captainName: "Jan Peeters",
  captainEmail: "jan@example.com",
  captainPhone: "0470 12 34 56",
  rulesAccepted: true,
  paymentAccepted: true,
  turnstileToken: "tok",
});

describe("formatEventDay", () => {
  it("writes the day the way the approved copy does", () => {
    expect(formatEventDay("2026-12-19")).toBe("zaterdag 19 december");
    expect(formatEventDay("2026-03-01")).toBe("zondag 1 maart");
  });
});

describe("buildDartsSignupEmails — a team with a spot", () => {
  const [captain, club] = buildDartsSignupEmails({
    payload,
    waitlist: false,
    number: 7,
  });

  it("mail 1 goes to the captain with reply-to the club", () => {
    expect(captain?.to).toBe("jan@example.com");
    expect(captain?.replyTo).toBe(DARTS_CLUB_EMAIL);
    expect(captain?.subject).toBe(
      "EK Darts: De Pijlenjagers is ingeschreven — nog even betalen",
    );
  });

  it("mail 1 takes the amount, the account and the reference from the facts file", () => {
    expect(captain?.text).toContain("Hallo Jan Peeters,");
    expect(captain?.text).toContain("als de €30 betaald is");
    expect(captain?.text).toContain(
      `${darts.betaling.iban} (${darts.betaling.rekeninghouder}), met als mededeling: EK Darts - De Pijlenjagers`,
    );
    expect(captain?.text).toContain("zaterdag 19 december in de kantine");
  });

  it("mail 1 keeps a team name with replacement tokens literal in the payment reference", () => {
    const [mail] = buildDartsSignupEmails({
      payload: { ...payload, teamName: "Team $&" },
      waitlist: false,
      number: 1,
    });
    expect(mail?.text).toContain("met als mededeling: EK Darts - Team $&");
  });

  it("mail 1 names the bank transfer only — no cash", () => {
    expect(captain?.text.toLowerCase()).not.toContain("cash");
    expect(captain?.text.toLowerCase()).not.toContain("café");
  });

  it("mail 4 goes to the club with reply-to the captain", () => {
    expect(club?.to).toBe(DARTS_CLUB_EMAIL);
    expect(club?.replyTo).toBe("jan@example.com");
    expect(club?.subject).toBe("EK Darts: De Pijlenjagers — ploeg 7/24");
    expect(club?.text).toContain("Status: ploeg 7 van 24");
    expect(club?.text).toContain(
      'Zet "Betaald" aan in de Studio zodra de €30 binnen is: dan vertrekt mail 2.',
    );
  });

  it("mail 4 drops the Opmerking line when the team wrote none", () => {
    expect(club?.text).not.toContain("Opmerking");
  });

  it("mail 4 keeps a remark on one line", () => {
    const [, withRemark] = buildDartsSignupEmails({
      payload: {
        ...payload,
        remark: "Eén speler komt later.\nGraag bij de bar.",
      },
      waitlist: false,
      number: 7,
    });
    expect(withRemark?.text).toContain(
      "Opmerking: Eén speler komt later. Graag bij de bar.",
    );
  });

  it("keeps a team name on one line in the subjects", () => {
    const [mail1, mail4] = buildDartsSignupEmails({
      payload: { ...payload, teamName: "De\nPijlenjagers" },
      waitlist: false,
      number: 7,
    });
    expect(mail1?.subject).toBe(
      "EK Darts: De Pijlenjagers is ingeschreven — nog even betalen",
    );
    expect(mail4?.subject).toBe("EK Darts: De Pijlenjagers — ploeg 7/24");
  });

  it("escapes what the captain typed in the HTML part", () => {
    const [mail] = buildDartsSignupEmails({
      payload: { ...payload, teamName: "<b>Team</b>" },
      waitlist: false,
      number: 1,
    });
    expect(mail?.html).toContain("&lt;b&gt;Team&lt;/b&gt;");
    expect(mail?.html).not.toContain("<b>Team</b>");
  });
});

describe("buildDartsSignupEmails — wachtlijst", () => {
  const [captain, club] = buildDartsSignupEmails({
    payload,
    waitlist: true,
    number: 2,
  });

  it("mail 3 tells the captain the place on the wachtlijst, without payment details", () => {
    expect(captain?.subject).toBe(
      "EK Darts: De Pijlenjagers staat op de wachtlijst",
    );
    expect(captain?.text).toContain(
      "De Pijlenjagers staat als 2e op de wachtlijst. Betalen hoeft nog niet.",
    );
    expect(captain?.text).not.toContain(darts.betaling.iban);
    expect(captain?.replyTo).toBe(DARTS_CLUB_EMAIL);
  });

  it("mail 4 switches its subject and last line", () => {
    expect(club?.subject).toBe("EK Darts: De Pijlenjagers — wachtlijst 2");
    expect(club?.text).toContain("Status: wachtlijst 2");
    expect(club?.text.endsWith("Laat het deze ploeg zelf weten.")).toBe(true);
    expect(club?.text).not.toContain("vertrekt mail 2");
  });
});

describe("buildDartsPaidEmail", () => {
  const mail = buildDartsPaidEmail({
    teamName: "De Pijlenjagers",
    captainName: "Jan Peeters",
    captainEmail: "jan@example.com",
  });

  it("goes to the captain with reply-to the club", () => {
    expect(mail.to).toBe("jan@example.com");
    expect(mail.replyTo).toBe(DARTS_CLUB_EMAIL);
    expect(mail.subject).toBe("EK Darts: De Pijlenjagers is er zeker bij");
  });

  it("reads the three hours from the facts file", () => {
    expect(mail.text).toContain(`- ${darts.uren.deuren} — deuren open`);
    expect(mail.text).toContain(
      `- tot ${darts.uren.aanmeldenTot} — aanmelden aan het onthaal, met jullie vier spelers`,
    );
    expect(mail.text).toContain(`- ${darts.uren.eersteWorp} — eerste pijl`);
    expect(mail.html).toContain(`<li>${darts.uren.deuren} — deuren open</li>`);
  });

  it("names the event day", () => {
    expect(mail.text).toContain(
      "De Pijlenjagers is er zeker bij op zaterdag 19 december.",
    );
  });
});
