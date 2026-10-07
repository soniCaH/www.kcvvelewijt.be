import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { MembershipForm } from "./MembershipForm";
import { DRAFT_STORAGE_KEY, EMPTY_DRAFT } from "./membership-draft";

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Voornaam/), {
    target: { value: "Jan" },
  });
  fireEvent.change(screen.getByLabelText(/Achternaam/), {
    target: { value: "Peeters" },
  });
  fireEvent.change(screen.getByLabelText(/Geboortedatum/), {
    target: { value: "1990-06-15" },
  });
  fireEvent.change(screen.getByLabelText(/Geslacht/), {
    target: { value: "m" },
  });
  fireEvent.change(screen.getByLabelText(/Gemeente/), {
    target: { value: "Elewijt" },
  });
  fireEvent.change(screen.getByLabelText(/^E-mail/), {
    target: { value: "jan@example.com" },
  });
  fireEvent.click(screen.getByLabelText(/privacyverklaring/i));
}

describe("MembershipForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the base fields", () => {
    render(<MembershipForm />);
    expect(screen.getByLabelText(/Voornaam/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Achternaam/)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
  });

  // #2547 rule 5 — an internal link never opens a new tab, so the external
  // mark can go on meaning exactly one thing.
  it("never opens the internal /privacy link in a new tab", () => {
    render(<MembershipForm />);
    const privacyLink = screen.getByRole("link", {
      name: /privacyverklaring/i,
    });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(privacyLink).not.toHaveAttribute("target");
    expect(privacyLink).not.toHaveAttribute("rel");
  });

  it("reveals the medical-certificate checkbox only for player roles", () => {
    render(<MembershipForm />);
    expect(screen.queryByText(/medisch attest/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/interesse als/i), {
      target: { value: "speler" },
    });
    expect(screen.getByText(/medisch attest/i)).toBeInTheDocument();
  });

  it("reveals the parent-consent block for a minor birth date", () => {
    render(<MembershipForm />);
    expect(screen.queryByText(/Minderjarig/i)).not.toBeInTheDocument();

    // Born ~10 years ago — always a minor regardless of when the test runs.
    const minorYear = new Date().getFullYear() - 10;
    fireEvent.change(screen.getByLabelText(/Geboortedatum/), {
      target: { value: `${minorYear}-05-01` },
    });
    expect(screen.getByLabelText(/E-mail ouder\/voogd/i)).toBeInTheDocument();
    expect(screen.getByText(/geef toestemming/i)).toBeInTheDocument();
  });

  it("posts to /api/membership and shows a success message", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<MembershipForm defaultRole="vrijwilliger" />);
    fillRequiredFields();
    fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

    await waitFor(() =>
      expect(
        screen.getByText(/Bedankt voor je interesse/i),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/membership",
      expect.objectContaining({ method: "POST" }),
    );
  });

  describe("remark (#3433)", () => {
    const postedBody = (fetchMock: ReturnType<typeof vi.fn>) =>
      JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      );

    it("offers an optional, labelled remark field capped at 1000 characters", () => {
      render(<MembershipForm />);
      const remark = screen.getByLabelText(/Opmerking/);
      expect(remark.tagName).toBe("TEXTAREA");
      expect(remark).toHaveAttribute("maxLength", "1000");
      expect(remark).not.toBeRequired();
    });

    it("sends the remark with the application", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      fireEvent.change(screen.getByLabelText(/Opmerking/), {
        target: { value: "Mijn zoon is keeper." },
      });
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(postedBody(fetchMock).remark).toBe("Mijn zoon is keeper.");
    });

    it("leaves an empty remark out of the request", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(postedBody(fetchMock)).not.toHaveProperty("remark");
    });
  });

  describe("submitting and success (#3384)", () => {
    const submitForm = () =>
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);
    const stubSuccessFetch = () =>
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ok: true }),
          }),
        ),
      );

    it("moves focus to the confirmation heading and scrolls to it after a successful submit", async () => {
      stubSuccessFetch();
      const scrollIntoView = vi.spyOn(HTMLElement.prototype, "scrollIntoView");

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      submitForm();

      const heading = await screen.findByRole("heading", {
        name: "Bedankt voor je interesse!",
      });
      await waitFor(() => expect(document.activeElement).toBe(heading));
      expect(heading).toHaveAttribute("tabindex", "-1");
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ block: "start" }),
      );
    });

    it("shows the compact spinner in a disabled, sending-named button while the request is pending", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})),
      );

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      submitForm();

      const button = await screen.findByRole("button", { name: "Versturen…" });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("type", "submit");
      expect(button.querySelector(".kcvv-spinner-pulse")).not.toBeNull();
    });

    it("announces the wait from a live region outside the button, empty when idle", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})),
      );

      render(<MembershipForm defaultRole="vrijwilliger" />);
      const liveRegion = () =>
        document.querySelector<HTMLElement>('form [aria-live="polite"]')!;
      expect(liveRegion()).toBeEmptyDOMElement();

      fillRequiredFields();
      submitForm();

      await waitFor(() => expect(liveRegion()).toHaveTextContent("Versturen…"));
    });

    it("keeps the footer caption as it was while sending", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})),
      );

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      submitForm();

      await screen.findByRole("button", { name: "Versturen…" });
      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    });
  });

  describe("transport failure (#2580)", () => {
    it("shows the locked notice and logs the caught error to the console only", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const networkError = new Error("Failed to fetch");
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(networkError)),
      );

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

      const notice = await screen.findByRole("alert");
      expect(notice).toHaveTextContent(
        "Verzenden mislukt. Controleer je internetverbinding en probeer opnieuw.",
      );
      // The visitor never sees the caught error's own text.
      expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("submit"),
        networkError,
      );
    });
  });

  describe("server rejection", () => {
    it("shows the server's own error, which is authored Dutch copy, not a raw caught error", async () => {
      // e.g. apps/api/src/handlers/forms.ts's stale-Turnstile message — this
      // instruction ("refresh the page") is the one that actually resolves
      // the failure, so it must survive.
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 400,
            json: () =>
              Promise.resolve({
                error:
                  "Verificatie mislukt. Vernieuw de pagina en probeer opnieuw.",
              }),
          }),
        ),
      );

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

      expect(
        await screen.findByText(
          "Verificatie mislukt. Vernieuw de pagina en probeer opnieuw.",
        ),
      ).toBeInTheDocument();
    });

    it("falls back to the locked generic message when the response carries no error field", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
          }),
        ),
      );

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

      expect(
        await screen.findByText(
          "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("stale notice cleared on resubmit", () => {
    it("clears a prior transport-failure notice when a client-validation error blocks resubmit", async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error("offline")));
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);
      // The accented "mislukt" splits this sentence across DOM nodes, so
      // assert via the notice's own role rather than a text regex spanning it.
      const transportNotice = await screen.findByRole("alert");
      expect(transportNotice).toHaveTextContent(/Verzenden mislukt/);

      // Clear a required field so the next submit is blocked client-side.
      fireEvent.change(screen.getByLabelText(/Voornaam/), {
        target: { value: "" },
      });
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

      await screen.findByText("Controleer de gemarkeerde velden.");
      // Blocking the resubmit also re-populates the field-level `<AlertBadge
      // variant="error">` under the now-empty "Voornaam" field, which is its
      // own `role="alert"` region — so assert on content, not count: no
      // surviving alert may still carry the stale transport notice's text.
      const staleNotice = screen
        .getAllByRole("alert")
        .find((el) => el.textContent?.includes("Verzenden mislukt"));
      expect(staleNotice).toBeUndefined();
    });
  });

  describe("draft (#3326)", () => {
    const RESTORED_NOTE = "We hebben je ingevulde gegevens bewaard.";
    const storedDraft = () =>
      JSON.parse(window.sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "null");
    const seedDraft = (overrides: Partial<typeof EMPTY_DRAFT> = {}) =>
      window.sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          ...EMPTY_DRAFT,
          role: "vrijwilliger",
          firstName: "Jan",
          lastName: "Peeters",
          ...overrides,
        }),
      );
    const submit = () =>
      fireEvent.submit(screen.getByText(/Verstuur aanvraag/).closest("form")!);

    it("shows no note on a fresh visit", () => {
      render(<MembershipForm />);
      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
      expect(screen.queryByText("Wis formulier")).not.toBeInTheDocument();
    });

    it("restores every field, the consent checkboxes included, with the note", async () => {
      const minorYear = new Date().getFullYear() - 10;
      seedDraft({
        role: "jeugdspeler",
        birthDate: `${minorYear}-05-01`,
        gender: "f",
        municipality: "Elewijt",
        email: "jan@example.com",
        priorClub: "FC Zemst",
        remark: "Mijn zoon is keeper.",
        parentEmail: "ouder@example.com",
        parentalConsent: true,
        medicalCertAcknowledged: true,
        privacyAccepted: true,
      });
      render(<MembershipForm />);

      expect(await screen.findByText(RESTORED_NOTE)).toBeInTheDocument();
      expect(screen.getByLabelText(/interesse als/i)).toHaveValue(
        "jeugdspeler",
      );
      expect(screen.getByLabelText(/Voornaam/)).toHaveValue("Jan");
      expect(screen.getByLabelText(/Achternaam/)).toHaveValue("Peeters");
      expect(screen.getByLabelText(/Geboortedatum/)).toHaveValue(
        `${minorYear}-05-01`,
      );
      expect(screen.getByLabelText(/Geslacht/)).toHaveValue("f");
      expect(screen.getByLabelText(/Gemeente/)).toHaveValue("Elewijt");
      expect(screen.getByLabelText(/^E-mail(?! ouder)/)).toHaveValue(
        "jan@example.com",
      );
      expect(screen.getByLabelText(/Vorige club/)).toHaveValue("FC Zemst");
      expect(screen.getByLabelText(/Opmerking/)).toHaveValue(
        "Mijn zoon is keeper.",
      );
      expect(screen.getByLabelText(/E-mail ouder\/voogd/i)).toHaveValue(
        "ouder@example.com",
      );
      expect(screen.getByLabelText(/geef toestemming/i)).toBeChecked();
      expect(screen.getByLabelText(/medisch attest/i)).toBeChecked();
      expect(screen.getByLabelText(/privacyverklaring/i)).toBeChecked();
    });

    it("keeps the draft as the visitor types", () => {
      render(<MembershipForm />);
      fireEvent.change(screen.getByLabelText(/Voornaam/), {
        target: { value: "Jan" },
      });
      fireEvent.click(screen.getByLabelText(/privacyverklaring/i));
      expect(storedDraft()).toMatchObject({
        firstName: "Jan",
        privacyAccepted: true,
      });
    });

    it("stores every visitor field typed through the UI", () => {
      render(<MembershipForm />);
      const minorYear = new Date().getFullYear() - 10;
      fireEvent.change(screen.getByLabelText(/interesse als/i), {
        target: { value: "jeugdspeler" },
      });
      fireEvent.change(screen.getByLabelText(/Voornaam/), {
        target: { value: "Jan" },
      });
      fireEvent.change(screen.getByLabelText(/Achternaam/), {
        target: { value: "Peeters" },
      });
      fireEvent.change(screen.getByLabelText(/Geboortedatum/), {
        target: { value: `${minorYear}-05-01` },
      });
      fireEvent.change(screen.getByLabelText(/Geslacht/), {
        target: { value: "f" },
      });
      fireEvent.change(screen.getByLabelText(/Gemeente/), {
        target: { value: "Elewijt" },
      });
      fireEvent.change(screen.getByLabelText(/^E-mail(?! ouder)/), {
        target: { value: "jan@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Vorige club/), {
        target: { value: "FC Zemst" },
      });
      fireEvent.change(screen.getByLabelText(/Opmerking/), {
        target: { value: "Mijn zoon is keeper." },
      });
      fireEvent.change(screen.getByLabelText(/E-mail ouder\/voogd/i), {
        target: { value: "ouder@example.com" },
      });
      fireEvent.click(screen.getByLabelText(/geef toestemming/i));
      fireEvent.click(screen.getByLabelText(/medisch attest/i));
      fireEvent.click(screen.getByLabelText(/privacyverklaring/i));

      expect(storedDraft()).toEqual({
        role: "jeugdspeler",
        firstName: "Jan",
        lastName: "Peeters",
        birthDate: `${minorYear}-05-01`,
        gender: "f",
        municipality: "Elewijt",
        email: "jan@example.com",
        priorClub: "FC Zemst",
        remark: "Mijn zoon is keeper.",
        parentEmail: "ouder@example.com",
        parentalConsent: true,
        medicalCertAcknowledged: true,
        privacyAccepted: true,
      });
    });

    it("does not write storage when a change leaves the value as it was", () => {
      render(<MembershipForm />);
      const role = screen.getByLabelText(/interesse als/i);
      fireEvent.change(role, { target: { value: "trainer" } });
      const setItem = vi.spyOn(window.sessionStorage, "setItem");
      fireEvent.change(role, { target: { value: "trainer" } });
      expect(setItem).not.toHaveBeenCalled();
    });

    it("writes nothing until the visitor edits a field", () => {
      render(<MembershipForm defaultRole="vrijwilliger" />);
      expect(window.sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it("lets a draft beat defaultRole and defaultBirthDate", async () => {
      seedDraft({ role: "trainer", birthDate: "1985-03-02" });
      render(
        <MembershipForm defaultRole="speler" defaultBirthDate="2014-05-01" />,
      );
      await screen.findByText(RESTORED_NOTE);
      expect(screen.getByLabelText(/interesse als/i)).toHaveValue("trainer");
      expect(screen.getByLabelText(/Geboortedatum/)).toHaveValue("1985-03-02");
    });

    it("restores the draft after hydrating server HTML, without a hydration mismatch", async () => {
      seedDraft({ email: "jan@example.com" });
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const container = document.createElement("div");
      document.body.appendChild(container);
      // The server has no draft: it renders the empty form.
      container.innerHTML = renderToString(<MembershipForm />);
      expect(container.querySelector("input[name=email]")).toHaveValue("");

      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, <MembershipForm />);
      });

      expect(container.querySelector("input[name=email]")).toHaveValue(
        "jan@example.com",
      );
      expect(container).toHaveTextContent(RESTORED_NOTE);
      expect(consoleError).not.toHaveBeenCalled();
      await act(async () => root.unmount());
      container.remove();
    });

    it("keeps the hydrated nodes when there is no draft", async () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      container.innerHTML = renderToString(<MembershipForm />);
      const before = container.querySelector("input[name=email]");

      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, <MembershipForm />);
      });

      expect(container.querySelector("input[name=email]")).toBe(before);
      await act(async () => root.unmount());
      container.remove();
    });

    it("does not remount the fields when typing writes a draft", () => {
      render(<MembershipForm />);
      const input = screen.getByLabelText(/Voornaam/);
      fireEvent.change(input, { target: { value: "Jan" } });
      expect(screen.getByLabelText(/Voornaam/)).toBe(input);
    });

    it("keeps both values when two changes land in one batch", () => {
      render(<MembershipForm />);
      act(() => {
        fireEvent.change(screen.getByLabelText(/Voornaam/), {
          target: { value: "Jan" },
        });
        fireEvent.change(screen.getByLabelText(/Achternaam/), {
          target: { value: "Peeters" },
        });
      });
      expect(storedDraft()).toMatchObject({
        firstName: "Jan",
        lastName: "Peeters",
      });
    });

    it("deletes the draft once every field is back to empty", () => {
      render(<MembershipForm />);
      const privacy = screen.getByLabelText(/privacyverklaring/i);
      fireEvent.click(privacy);
      expect(storedDraft()).not.toBeNull();
      fireEvent.click(privacy);
      expect(window.sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it("ignores a stored draft that holds no answer", () => {
      seedDraft({ role: "", firstName: "", lastName: "" });
      render(<MembershipForm />);
      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
    });

    it.each([
      ["role", { role: "keeper" }],
      ["gender", { gender: "z" }],
    ])("ignores a draft with an unknown %s", (_name, overrides) => {
      seedDraft(overrides as Partial<typeof EMPTY_DRAFT>);
      render(<MembershipForm />);
      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
    });

    it("clears a transport-failure notice and focuses the first field on Wis formulier", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(new Error("offline"))),
      );
      seedDraft({
        gender: "m",
        municipality: "Elewijt",
        birthDate: "1990-06-15",
        email: "jan@example.com",
        privacyAccepted: true,
      });
      render(<MembershipForm />);
      await screen.findByText(RESTORED_NOTE);
      submit();
      await screen.findByRole("alert");

      fireEvent.click(screen.getByText("Wis formulier"));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/interesse als/i)).toHaveFocus();
    });

    it("keeps the link defaults when there is no draft", () => {
      render(<MembershipForm defaultRole="speler" />);
      expect(screen.getByLabelText(/interesse als/i)).toHaveValue("speler");
    });

    it("empties every field and deletes the draft on Wis formulier", async () => {
      seedDraft({ privacyAccepted: true, email: "jan@example.com" });
      render(<MembershipForm />);
      fireEvent.click(await screen.findByText("Wis formulier"));

      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/interesse als/i)).toHaveValue("");
      expect(screen.getByLabelText(/Voornaam/)).toHaveValue("");
      expect(screen.getByLabelText(/^E-mail/)).toHaveValue("");
      expect(screen.getByLabelText(/privacyverklaring/i)).not.toBeChecked();
      expect(window.sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it("never stores the Turnstile token or the honeypot", () => {
      render(<MembershipForm />);
      fireEvent.change(document.querySelector("input[name=company]")!, {
        target: { value: "bot" },
      });
      fireEvent.change(screen.getByLabelText(/Voornaam/), {
        target: { value: "Jan" },
      });
      const keys = Object.keys(storedDraft());
      expect(keys).not.toContain("company");
      expect(keys).not.toContain("honeypot");
      expect(keys).not.toContain("turnstileToken");
      expect(window.sessionStorage.getItem(DRAFT_STORAGE_KEY)).not.toMatch(
        /bot/,
      );
    });

    it("deletes the draft after a successful submit", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ok: true }),
          }),
        ),
      );
      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      expect(storedDraft()).not.toBeNull();
      submit();

      await screen.findByText(/Bedankt voor je interesse/i);
      expect(window.sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it("keeps the draft after a failed submit", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(new Error("offline"))),
      );
      render(<MembershipForm defaultRole="vrijwilliger" />);
      fillRequiredFields();
      submit();

      await screen.findByRole("alert");
      expect(storedDraft()).toMatchObject({ firstName: "Jan" });
    });

    it("keeps a draft saved before a field was added", async () => {
      const { remark: _remark, ...olderDraft } = {
        ...EMPTY_DRAFT,
        role: "vrijwilliger" as const,
        firstName: "Jan",
      };
      window.sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(olderDraft),
      );
      render(<MembershipForm />);
      expect(await screen.findByText(RESTORED_NOTE)).toBeInTheDocument();
      expect(screen.getByLabelText(/Voornaam/)).toHaveValue("Jan");
      expect(screen.getByLabelText(/Opmerking/)).toHaveValue("");
    });

    it("ignores a malformed draft", () => {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, '{"firstName":3}');
      render(<MembershipForm />);
      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, "not json");
      render(<MembershipForm />);
      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
    });

    it("degrades to a plain form when sessionStorage throws", () => {
      vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
      render(<MembershipForm />);
      fireEvent.change(screen.getByLabelText(/Voornaam/), {
        target: { value: "Jan" },
      });
      expect(screen.getByLabelText(/Voornaam/)).toHaveValue("Jan");
      expect(screen.queryByText(RESTORED_NOTE)).not.toBeInTheDocument();
    });

    it("degrades when setItem throws (quota)", () => {
      vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
      render(<MembershipForm />);
      fireEvent.change(screen.getByLabelText(/Voornaam/), {
        target: { value: "Jan" },
      });
      expect(screen.getByLabelText(/Voornaam/)).toHaveValue("Jan");
    });
  });
});
