import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";

const mockRun = vi.fn();
const mockReset = vi.fn();
const mockAcceptedCategory = vi.fn();

vi.mock("vanilla-cookieconsent", () => ({
  run: mockRun,
  reset: mockReset,
  acceptedCategory: mockAcceptedCategory,
}));

const mockUpdateConsentState = vi.fn();
vi.mock("@/lib/analytics/gtm-consent", () => ({
  updateConsentState: mockUpdateConsentState,
}));

// Import after mock is set up
const { CookieConsentBanner } = await import("./CookieConsentBanner");

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    mockRun.mockClear();
    mockReset.mockClear();
    mockAcceptedCategory.mockClear();
    mockUpdateConsentState.mockClear();
    mockRun.mockResolvedValue(undefined);
  });

  it("calls CookieConsent.run on mount", () => {
    render(<CookieConsentBanner />);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it("passes a config object with nl language and two categories", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.language.default).toBe("nl");
    expect(config.categories.necessary).toBeDefined();
    expect(config.categories.analytics).toBeDefined();
  });

  it("uses the box consent-modal layout in the bottom-left corner", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.guiOptions.consentModal.layout).toBe("box");
    expect(config.guiOptions.consentModal.position).toBe("bottom left");
  });

  it("uses the locked 'Koekjes?' banner heading", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.language.translations.nl.consentModal.title).toBe("Koekjes?");
  });

  // Decision D4 (#2620): the banner is third-party DOM built from
  // `innerHTML`-assigned label strings, so the bracket rides in the string —
  // aria-hidden, and never as the button's accessible name.
  it("prefixes both dismissal labels with the aria-hidden mono bracket", () => {
    render(<CookieConsentBanner />);
    const { consentModal, preferencesModal } =
      mockRun.mock.calls[0][0].language.translations.nl;
    const bracketed = '<span aria-hidden="true">[×]</span> Alleen noodzakelijk';

    expect(consentModal.acceptNecessaryBtn).toBe(bracketed);
    expect(preferencesModal.acceptNecessaryBtn).toBe(bracketed);
  });

  it("leaves every non-dismissal label unbracketed", () => {
    render(<CookieConsentBanner />);
    const { consentModal, preferencesModal } =
      mockRun.mock.calls[0][0].language.translations.nl;

    expect(consentModal.acceptAllBtn).toBe("Alles accepteren");
    expect(consentModal.showPreferencesBtn).toBe("Beheer voorkeuren");
    expect(preferencesModal.acceptAllBtn).toBe("Alles accepteren");
    expect(preferencesModal.savePreferencesBtn).toBe("Sla op");
  });

  // #2675: every other close on the site is the Phosphor Fill `X`; the
  // library draws its own thin stroke X and exposes no option for it, so the
  // house icon is swapped in when the preferences modal is built.
  function libraryModal() {
    const modal = document.createElement("div");
    modal.innerHTML =
      '<button class="pm__close-btn" aria-label="Sluiten"><span><svg viewBox="0 0 24 24"><path d="M 19.5 4.5 L 4.5 19.5"/></svg></span></button>';
    document.body.append(modal);
    return modal;
  }

  it("swaps the preferences close's library X for the house close icon", () => {
    render(<CookieConsentBanner />);
    const modal = libraryModal();

    act(() => {
      mockRun.mock.calls[0][0].onModalReady({
        modalName: "preferencesModal",
        modal,
      });
    });

    const icons = modal.querySelectorAll(".pm__close-btn svg");
    expect(icons).toHaveLength(1);
    expect(icons[0].getAttribute("viewBox")).toBe("0 0 256 256");
    expect(modal.querySelector(".pm__close-btn")).toHaveAccessibleName(
      "Sluiten",
    );
  });

  it("leaves the consent modal's markup to the library", () => {
    render(<CookieConsentBanner />);
    const modal = libraryModal();

    act(() => {
      mockRun.mock.calls[0][0].onModalReady({
        modalName: "consentModal",
        modal,
      });
    });

    expect(modal.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "0 0 24 24",
    );
  });

  it("renders nothing visible", () => {
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("calls CookieConsent.reset on unmount", () => {
    const { unmount } = render(<CookieConsentBanner />);
    unmount();
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith(false);
  });

  it("registers an onConsent callback", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.onConsent).toBeTypeOf("function");
  });

  it("registers an onChange callback", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.onChange).toBeTypeOf("function");
  });

  it("onConsent calls updateConsentState with true when analytics accepted", () => {
    mockAcceptedCategory.mockReturnValue(true);
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];

    config.onConsent();

    expect(mockAcceptedCategory).toHaveBeenCalledWith("analytics");
    expect(mockUpdateConsentState).toHaveBeenCalledWith(true);
  });

  it("onConsent calls updateConsentState with false when analytics not accepted", () => {
    mockAcceptedCategory.mockReturnValue(false);
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];

    config.onConsent();

    expect(mockAcceptedCategory).toHaveBeenCalledWith("analytics");
    expect(mockUpdateConsentState).toHaveBeenCalledWith(false);
  });

  it("onChange calls updateConsentState based on current accepted category", () => {
    mockAcceptedCategory.mockReturnValue(true);
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];

    config.onChange({
      changedCategories: ["analytics"],
      changedServices: {},
      cookie: {},
    });

    expect(mockUpdateConsentState).toHaveBeenCalledWith(true);
  });
});
