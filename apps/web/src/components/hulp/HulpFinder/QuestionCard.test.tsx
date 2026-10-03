import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import type { ResponsibilityPath } from "@/types/responsibility";

const path: ResponsibilityPath = {
  id: "inschrijven",
  category: "administratief",
  role: [],
  title: "Inschrijven",
  question: "Hoe schrijf ik mijn kind in?",
  keywords: [],
  summary: "Inschrijven kan het hele seizoen door.",
  steps: [
    { description: "Mail de jeugdsecretaris." },
    { description: "Vul het formulier in.", link: "/inschrijven" },
  ],
  primaryContact: {
    contactType: "manual",
    role: "Jeugdsecretaris",
    email: "jeugd@kcvvelewijt.be",
  },
};

const noop = () => {};

/** The answer panel that holds `text` (the `region` the header controls). */
const panelOf = (text: RegExp) =>
  screen.getByText(text).closest<HTMLElement>('[role="region"]')!;

/** The grid wrapper that transitions `grid-template-rows` (the panel's clip's parent). */
const growOf = (panel: HTMLElement) => panel.parentElement!.parentElement!;

describe("QuestionCard", () => {
  it("always renders the question; the answer stays mounted but inert until open", () => {
    const { rerender } = render(
      <QuestionCard path={path} open={false} onToggle={noop} />,
    );
    const button = screen.getByRole("button", {
      name: /hoe schrijf ik mijn kind in/i,
    });
    expect(button).toHaveAttribute("aria-expanded", "false");
    const closedPanel = panelOf(/inschrijven kan het hele seizoen/i);
    expect(closedPanel).toHaveAttribute("inert");
    expect(button).toHaveAttribute("aria-controls", closedPanel.id);

    rerender(<QuestionCard path={path} open onToggle={noop} />);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panelOf(/inschrijven kan het hele seizoen/i)).not.toHaveAttribute(
      "inert",
    );
  });

  it("calls onToggle when the header is activated", () => {
    const onToggle = vi.fn();
    render(<QuestionCard path={path} open={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /hoe schrijf ik/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders numbered steps with their inline links when open", () => {
    render(<QuestionCard path={path} open onToggle={noop} />);
    expect(screen.getByText("Mail de jeugdsecretaris.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meer info/i })).toHaveAttribute(
      "href",
      "/inschrijven",
    );
  });

  it("renders the contact in the person vocab inside the answer", () => {
    render(<QuestionCard path={path} open onToggle={noop} />);
    expect(screen.getByText("Jeugdsecretaris")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /e-mail/i })).toHaveAttribute(
      "href",
      "mailto:jeugd@kcvvelewijt.be",
    );
  });

  it("links the answer panel to the header via aria-controls (accordion a11y)", () => {
    render(<QuestionCard path={path} open onToggle={noop} />);
    const button = screen.getByRole("button", { name: /hoe schrijf ik/i });
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toBeInTheDocument();
  });

  describe("scroll-back guard (#3398)", () => {
    const scrollIntoView = vi.fn();
    let top = 0;
    let reduced = false;

    beforeEach(() => {
      scrollIntoView.mockClear();
      Element.prototype.scrollIntoView = scrollIntoView;
      // The sticky nav publishes its height as `scroll-padding-top` on <html>.
      document.documentElement.style.scrollPaddingTop = "80px";
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
        () => ({ top }) as DOMRect,
      );
      vi.stubGlobal(
        "matchMedia",
        (query: string) =>
          ({ matches: reduced, media: query }) as MediaQueryList,
      );
    });
    afterEach(() => {
      document.documentElement.style.scrollPaddingTop = "";
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      reduced = false;
    });

    const openCard = () => {
      render(<QuestionCard path={path} open onToggle={noop} />);
      return growOf(panelOf(/inschrijven kan het hele seizoen/i));
    };
    // happy-dom's TransitionEvent drops `propertyName` from its init, so build
    // a bubbling event by hand and set it.
    const transitionEnd = (el: Element, propertyName: string) => {
      const event = new Event("transitionend", { bubbles: true });
      Object.defineProperty(event, "propertyName", { value: propertyName });
      fireEvent(el, event);
    };
    const heightEnded = (el: Element) =>
      transitionEnd(el, "grid-template-rows");

    it("shows the header at the top when it ended up under the sticky nav", () => {
      top = 20;
      heightEnded(openCard());
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "start",
        behavior: "smooth",
      });
    });

    it("does nothing when the header is already visible", () => {
      top = 200;
      heightEnded(openCard());
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("ignores other properties and a child's transition", () => {
      top = 20;
      const grow = openCard();
      transitionEnd(grow, "opacity");
      heightEnded(screen.getByText("Mail de jeugdsecretaris."));
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("does not run when a card finishes closing", () => {
      top = 20;
      render(<QuestionCard path={path} open={false} onToggle={noop} />);
      heightEnded(growOf(panelOf(/inschrijven kan het hele seizoen/i)));
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("under reduced motion runs at once on open, instantly", () => {
      top = 20;
      reduced = true;
      const { rerender } = render(
        <QuestionCard path={path} open={false} onToggle={noop} />,
      );
      expect(scrollIntoView).not.toHaveBeenCalled();
      rerender(<QuestionCard path={path} open onToggle={noop} />);
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "start",
        behavior: "instant",
      });
    });

    it("does not run for a card that mounts already open", () => {
      top = 20;
      reduced = true;
      render(<QuestionCard path={path} open onToggle={noop} />);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
