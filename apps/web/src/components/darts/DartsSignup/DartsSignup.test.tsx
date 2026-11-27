import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { useEffect } from "react";
import { DartsSignup, DartsSignupForm } from "./DartsSignup";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// The widget's latest callbacks, so a test decides when a token arrives or the
// widget fails. `mountToken` is the token on mount; "" = none yet.
const widget = vi.hoisted(() => ({
  onToken: (_token: string) => {},
  onError: () => {},
  mountToken: "token-0",
}));

vi.mock("@/components/club/MembershipForm/TurnstileWidget", () => ({
  // A token on mount. After a reset the test hands over the fresh one itself.
  TurnstileWidget: ({
    onToken,
    onError,
    resetKey,
  }: {
    onToken: (token: string) => void;
    onError?: () => void;
    resetKey: number;
  }) => {
    useEffect(() => {
      widget.onToken = onToken;
      widget.onError = onError ?? (() => {});
      if (resetKey === 0 && widget.mountToken) onToken(widget.mountToken);
    }, [onToken, onError, resetKey]);
    return <span data-testid="turnstile" data-reset-key={resetKey} />;
  },
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

/** Routes by URL: the spots read and the signup POST. */
const stubBackend = (opts: {
  spotsLeft?: number | "fail";
  submit?: () => Response;
}) => {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url === "/api/darts/spots") {
      if (opts.spotsLeft === "fail") throw new Error("down");
      return json({ spotsLeft: opts.spotsLeft ?? 24 });
    }
    return opts.submit?.() ?? json({ ok: true, waitlist: false });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const fillRequired = () => {
  fireEvent.change(screen.getByLabelText(/Ploegnaam/), {
    target: { value: "De Pijlenjagers" },
  });
  fireEvent.change(screen.getByLabelText(/Naam kapitein/), {
    target: { value: "Jan Peeters" },
  });
  fireEvent.change(screen.getByLabelText(/Gsm kapitein/), {
    target: { value: "0470 12 34 56" },
  });
  fireEvent.change(screen.getByLabelText(/E-mail kapitein/), {
    target: { value: "jan@example.com" },
  });
  fireEvent.click(screen.getByLabelText(/Ik ken het reglement/));
  fireEvent.click(screen.getByLabelText(/pas definitief/));
};

const submit = () =>
  fireEvent.submit(screen.getByText("Schrijf onze ploeg in").closest("form")!);

describe("DartsSignupForm", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
    widget.mountToken = "token-0";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe("intro", () => {
    it("says how many spots are left, read live from the BFF", async () => {
      const fetchMock = stubBackend({ spotsLeft: 9 });
      render(<DartsSignupForm />);

      expect(
        await screen.findByText(
          "Schrijf je ploeg in. Nog 9 van de 24 plaatsen vrij.",
        ),
      ).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/darts/spots",
        expect.objectContaining({ cache: "no-store" }),
      );
    });

    it("offers the wachtlijst when all spots are taken", async () => {
      stubBackend({ spotsLeft: 0 });
      render(<DartsSignupForm />);

      expect(
        await screen.findByText(
          "Alle 24 plaatsen zijn ingenomen. Schrijf je toch in: dan staan jullie op de wachtlijst.",
        ),
      ).toBeInTheDocument();
    });

    it("stays neutral when the count cannot be read", async () => {
      const fetchMock = stubBackend({ spotsLeft: "fail" });
      render(<DartsSignupForm />);

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(screen.getByText("Schrijf je ploeg in.")).toBeInTheDocument();
    });
  });

  it("shows the approved labels, help texts and the price from the facts file", () => {
    stubBackend({});
    render(<DartsSignupForm />);

    expect(
      screen.getByText("Dit is ook de mededeling bij jullie betaling."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alle info komt op dit adres."),
    ).toBeInTheDocument();
    expect(screen.getByText("Iets dat we moeten weten?")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Opmerking (niet verplicht)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Onze inschrijving is pas definitief als de €30 betaald is.",
      ),
    ).toBeInTheDocument();
  });

  it("caps the text fields at the lengths the BFF accepts", () => {
    stubBackend({});
    render(<DartsSignupForm />);

    expect(screen.getByLabelText(/Ploegnaam/)).toHaveAttribute(
      "maxlength",
      "100",
    );
    expect(screen.getByLabelText(/Naam kapitein/)).toHaveAttribute(
      "maxlength",
      "100",
    );
    expect(screen.getByLabelText(/Gsm kapitein/)).toHaveAttribute(
      "maxlength",
      "30",
    );
  });

  it("does not post while required fields are empty, and marks them", () => {
    const fetchMock = stubBackend({});
    render(<DartsSignupForm />);

    submit();

    expect(fetchMock).not.toHaveBeenCalledWith("/api/darts", expect.anything());
    expect(screen.getAllByText("Verplicht.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bevestig dit om verder te gaan.")).toHaveLength(
      2,
    );
    expect(trackEvent).toHaveBeenCalledWith("darts_signup_error", {
      fields:
        "captainEmail,captainName,captainPhone,paymentAccepted,rulesAccepted,teamName",
      source: "client",
    });
  });

  it("posts the signup and confirms it", async () => {
    const fetchMock = stubBackend({});
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText(
        "Ingeschreven! Kijk in je mailbox: daar staat hoe je betaalt.",
      ),
    ).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([url]) => url === "/api/darts")!;
    expect(JSON.parse((post[1] as RequestInit).body as string)).toEqual({
      teamName: "De Pijlenjagers",
      captainName: "Jan Peeters",
      captainEmail: "jan@example.com",
      captainPhone: "0470 12 34 56",
      rulesAccepted: true,
      paymentAccepted: true,
      turnstileToken: "token-0",
      company: "",
    });
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("darts_signup_submit", {
        waitlist: false,
        has_remark: false,
      }),
    );
  });

  it("confirms the wachtlijst when the BFF put the team there", async () => {
    stubBackend({ submit: () => json({ ok: true, waitlist: true }) });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText(
        "Jullie staan op de wachtlijst. Komt er een plaats vrij, dan laten we het weten.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the BFF's own message when it refuses the signup", async () => {
    stubBackend({
      submit: () => json({ error: "De inschrijvingen zijn gesloten." }, 400),
    });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText("De inschrijvingen zijn gesloten."),
    ).toBeInTheDocument();
  });

  const postedBody = (fetchMock: ReturnType<typeof stubBackend>) => {
    const posts = fetchMock.mock.calls.filter(([url]) => url === "/api/darts");
    return JSON.parse((posts.at(-1)![1] as RequestInit).body as string);
  };

  it("shows the field errors the BFF returns and reports them as a server error", async () => {
    stubBackend({
      submit: () =>
        json(
          {
            error: "Sommige velden ontbreken of zijn ongeldig.",
            fields: { captainEmail: "Dit e-mailadres klopt niet." },
          },
          400,
        ),
    });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText("Dit e-mailadres klopt niet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sommige velden ontbreken of zijn ongeldig."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("darts_signup_error", {
        fields: "captainEmail",
        source: "server",
      }),
    );
  });

  it("shows the generic error, not the success message, for a 200 whose body is not the contract's (#3878)", async () => {
    // A real signup body with a wrong-typed field.
    stubBackend({ submit: () => json({ ok: true, waitlist: "yes" }) });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText(
        "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ingeschreven!/)).toBeNull();
  });

  it("shows the generic error when the response body is not JSON (#3878)", async () => {
    stubBackend({
      submit: () => new Response("<html>Bad gateway</html>", { status: 502 }),
    });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText(
        "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
      ),
    ).toBeInTheDocument();
  });

  it("treats the proxy's bare { ok: true } as a signup without a wachtlijst spot (#3878)", async () => {
    // `proxyFormPost` answers this when the BFF's 2xx body is not JSON: the team
    // is stored, so a second submit would store it twice.
    stubBackend({ submit: () => json({ ok: true }) });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(await screen.findByText(/Ingeschreven!/)).toBeInTheDocument();
    expect(screen.queryByText(/wachtlijst\. Komt er/)).toBeNull();
  });

  it("keeps the neutral intro when the spots body is not the contract's (#3878)", async () => {
    const fetchMock = stubBackend({ spotsLeft: 1.5 });
    render(<DartsSignupForm />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Let the spots response settle before asserting what is absent.
    await act(async () => {});

    expect(screen.getByText("Schrijf je ploeg in.")).toBeInTheDocument();
    expect(screen.queryByText(/Nog 1.5/)).toBeNull();
  });

  it("falls back to a generic message when the refusal carries none", async () => {
    stubBackend({ submit: () => json({}, 500) });
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText(
        "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the network failure notice and gives the retry a fresh Turnstile token", async () => {
    const fetchMock = stubBackend({
      submit: () => {
        throw new Error("offline");
      },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DartsSignupForm />);
    fillRequired();
    submit();

    expect(
      await screen.findByText(/Controleer je internetverbinding/),
    ).toBeInTheDocument();

    // The failed attempt used up its token: the widget was asked for a new one.
    await waitFor(() =>
      expect(screen.getByTestId("turnstile")).toHaveAttribute(
        "data-reset-key",
        "1",
      ),
    );
    act(() => widget.onToken("token-1"));
    submit();
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/api/darts"),
      ).toHaveLength(2),
    );
    expect(postedBody(fetchMock).turnstileToken).toBe("token-1");
  });

  describe("without a Turnstile token (#3902)", () => {
    const signupPosts = (fetchMock: ReturnType<typeof stubBackend>) =>
      fetchMock.mock.calls.filter(([url]) => url === "/api/darts");

    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
      widget.mountToken = "";
    });

    it("does not post while the check is still running, and says so with the button still enabled", () => {
      const fetchMock = stubBackend({});
      render(<DartsSignupForm />);
      fillRequired();

      submit();

      expect(signupPosts(fetchMock)).toHaveLength(0);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "De verificatie loopt nog. Probeer het zo meteen opnieuw.",
      );
      expect(
        screen.getByRole("button", { name: /Schrijf onze ploeg in/ }),
      ).toBeEnabled();
      expect(screen.getByLabelText(/Ploegnaam/)).toHaveValue("De Pijlenjagers");
    });

    it("does not post when the widget failed, says so and re-runs the widget", () => {
      const fetchMock = stubBackend({});
      render(<DartsSignupForm />);
      fillRequired();
      act(() => widget.onError());

      submit();

      expect(signupPosts(fetchMock)).toHaveLength(0);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "De verificatie laadt niet. Probeer het later opnieuw.",
      );
      expect(screen.getByTestId("turnstile")).toHaveAttribute(
        "data-reset-key",
        "1",
      );
    });

    it("posts the token once it arrives, and drops the line", async () => {
      const fetchMock = stubBackend({});
      render(<DartsSignupForm />);
      fillRequired();
      act(() => widget.onError());
      submit();

      act(() => widget.onToken("late-token"));
      submit();

      await waitFor(() => expect(signupPosts(fetchMock)).toHaveLength(1));
      expect(postedBody(fetchMock).turnstileToken).toBe("late-token");
      expect(
        screen.queryByText(/De verificatie laadt niet/),
      ).not.toBeInTheDocument();
    });
  });

  it("submits the remark and the honeypot value as typed", async () => {
    const fetchMock = stubBackend({});
    const { container } = render(<DartsSignupForm />);
    fillRequired();
    fireEvent.change(screen.getByLabelText(/Opmerking/), {
      target: { value: "Eén speler komt later." },
    });
    fireEvent.change(container.querySelector('input[name="company"]')!, {
      target: { value: "bot" },
    });
    submit();

    await screen.findByText(/Ingeschreven!/);
    expect(postedBody(fetchMock)).toMatchObject({
      remark: "Eén speler komt later.",
      company: "bot",
    });
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("darts_signup_submit", {
        waitlist: false,
        has_remark: true,
      }),
    );
  });

  it("fires one start event for several field changes, with no values", () => {
    stubBackend({});
    render(<DartsSignupForm />);

    fireEvent.change(screen.getByLabelText(/Ploegnaam/), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByLabelText(/Naam kapitein/), {
      target: { value: "B" },
    });

    expect(
      vi
        .mocked(trackEvent)
        .mock.calls.filter(([n]) => n === "darts_signup_start"),
    ).toEqual([["darts_signup_start"]]);
  });
});

describe("DartsSignup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("is on the page up to and including the event day", () => {
    stubBackend({});
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-12-19T21:00:00Z"),
    });
    render(<DartsSignup />);

    expect(
      screen.getByRole("region", { name: "Inschrijven" }),
    ).toBeInTheDocument();
  });

  it("is gone once the event day is over", () => {
    stubBackend({});
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-12-20T09:00:00Z"),
    });
    const { container } = render(<DartsSignup />);

    expect(container).toBeEmptyDOMElement();
  });
});
