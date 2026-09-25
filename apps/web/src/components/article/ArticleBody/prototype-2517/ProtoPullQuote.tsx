"use client";

/**
 * PROTOTYPE — #2517. Throwaway. Do not promote to production.
 *
 * Question: what does an attributed pull quote WITH a photo and a caption
 * look like inside an article body? Four structurally different answers,
 * switchable via `?variant=A|B|C|D` and the floating bar (← / → keys).
 *
 * The page injects one fake `pullQuote` block (`_key: "proto-2517"`) into
 * the real article body; the photo is the article's own cover image.
 */

import Image from "next/image";
import { useEffect, useSyncExternalStore } from "react";
import {
  PullQuote,
  QuoteMark,
  SubjectAvatar,
  TapedFigure,
} from "@/components/design-system";

export interface ProtoPullQuoteValue {
  _key: "proto-2517";
  body: string;
  name: string;
  role: string;
  photoUrl?: string;
  caption: string;
  credit: string;
}

const VARIANTS = ["A", "B", "C", "D", "E"] as const;
type Variant = (typeof VARIANTS)[number];
const EVENT = "proto-2517-variant";
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const readVariant = (): Variant => {
  const v = new URL(window.location.href).searchParams.get("variant");
  return VARIANTS.includes(v as Variant) ? (v as Variant) : "A";
};
const NAMES: Record<Variant, string> = {
  A: "Vandaag: klein rond portret",
  B: "Foto naast het citaat",
  C: "Citaat op de foto geplakt",
  D: "Citaat over de foto",
  E: "Mix: D bij grote foto, anders donkere A",
};

// Same breakout as `articleImage` width="wide".
const WIDE =
  "mx-auto w-full md:w-auto md:max-w-[var(--container-wide,1040px)] md:mx-[calc(50%-min(50vw,calc(var(--container-wide,1040px)/2)))]";

function Attribution({
  v,
  cream,
}: {
  v: ProtoPullQuoteValue;
  cream?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`font-display text-xl leading-tight italic ${cream ? "text-cream" : "text-ink"}`}
      >
        {v.name}
      </span>
      <span
        className={`text-label font-mono leading-none uppercase ${cream ? "text-cream" : "text-ink-muted"}`}
      >
        {v.role}
      </span>
    </div>
  );
}

function Photo({ v, sizes }: { v: ProtoPullQuoteValue; sizes: string }) {
  return v.photoUrl ? (
    <Image
      src={v.photoUrl}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
    />
  ) : null;
}

// A — what ArticleBody renders today: card + 64px round avatar, no big photo.
function VariantA({ v }: { v: ProtoPullQuoteValue }) {
  return (
    <div className="my-10">
      <PullQuote
        attribution={{ name: v.name, role: v.role }}
        avatarSlot={
          <SubjectAvatar
            firstName={v.name.split(" ")[0] ?? v.name}
            photoUrl={v.photoUrl}
            scale="attribution"
          />
        }
      >
        {v.body}
      </PullQuote>
    </div>
  );
}

// B — two columns at wide width: taped portrait photo + caption left, the
// quote as bare type right. Stacks photo-first on mobile.
function VariantB({ v }: { v: ProtoPullQuoteValue }) {
  return (
    <div className={`my-12 ${WIDE}`}>
      <div className="grid items-center gap-8 md:grid-cols-[2fr_3fr]">
        <TapedFigure
          aspect="portrait-3-4"
          caption={v.caption}
          credit={v.credit}
          tape={{
            color: "warm",
            length: "sm",
            position: "left",
            rotation: "a",
          }}
        >
          <Photo v={v} sizes="(max-width: 768px) 100vw, 420px" />
        </TapedFigure>
        <div className="flex flex-col gap-4">
          <QuoteMark color="jersey" />
          <blockquote className="font-display text-display-sm text-ink italic">
            {v.body}
          </blockquote>
          <Attribution v={v} />
        </div>
      </div>
    </div>
  );
}

// C — wide landscape photo with caption; today's cream quote card pinned
// over its lower-right corner like a clipping taped onto the print.
function VariantC({ v }: { v: ProtoPullQuoteValue }) {
  return (
    <div className={`my-12 ${WIDE}`}>
      <TapedFigure aspect="landscape-3-2" caption={v.caption} credit={v.credit}>
        <Photo v={v} sizes="(max-width: 768px) 100vw, 1040px" />
      </TapedFigure>
      <div className="relative z-10 -mt-10 px-4 md:-mt-40 md:ml-auto md:w-[58%] md:px-0 md:pr-6">
        <PullQuote
          attribution={{ name: v.name, role: v.role }}
          rotation="b"
          tape={{
            color: "warm",
            length: "sm",
            position: "right",
            rotation: "b",
          }}
        >
          {v.body}
        </PullQuote>
      </div>
    </div>
  );
}

// D — the photo IS the quote: full-bleed image, ink scrim, cream display
// type on top, caption + credit under the image at prose width.
function VariantD({ v }: { v: ProtoPullQuoteValue }) {
  return (
    <figure className="mx-[calc(50%-50vw)] my-12 w-screen max-w-[100vw]">
      <div className="bg-ink relative min-h-[70vh] w-full overflow-hidden">
        <Photo v={v} sizes="100vw" />
        <div className="from-ink via-ink/60 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[var(--container-prose,680px)] flex-col gap-4 px-4 pb-10">
          <QuoteMark color="cream" />
          <blockquote className="font-display text-display-sm text-cream italic">
            {v.body}
          </blockquote>
          <Attribution v={v} cream />
        </div>
      </div>
      <figcaption className="text-body-sm mx-auto mt-2 flex max-w-[var(--container-prose,680px)] justify-between gap-3 px-4">
        <span className="text-ink-muted">{v.caption}</span>
        <span className="text-mono-sm text-ink-muted font-mono uppercase">
          {v.credit}
        </span>
      </figcaption>
    </figure>
  );
}

// A real small staff portrait from staging (Mark Talbut), for E's middle case.
const SMALL_PHOTO =
  "https://cdn.sanity.io/images/vhb33jaz/staging/8258d4c0d0a3ba813331c72826fa3fc84524c4e4-1250x1250.png";

// E's card: A's structure (card + round avatar) in D's register (ink,
// cream display type). Used whenever there is no big photo.
function DarkCard({
  v,
  photoUrl,
}: {
  v: ProtoPullQuoteValue;
  photoUrl?: string;
}) {
  return (
    <div className="my-10">
      <PullQuote
        placement="section"
        attribution={{ name: v.name, role: v.role }}
        avatarSlot={
          <SubjectAvatar
            firstName={v.name.split(" ")[0] ?? v.name}
            photoUrl={photoUrl}
            scale="attribution"
          />
        }
      >
        {v.body}
      </PullQuote>
    </div>
  );
}

function CaseLabel({ children }: { children: string }) {
  return (
    <p className="text-label text-jersey-deep mt-12 font-mono uppercase">
      ▼ {children}
    </p>
  );
}

// E — one block, three photo situations. The editor never picks a layout:
// a big photo (≥ ~1200px wide) gets D, anything else gets the dark card.
function VariantE({ v }: { v: ProtoPullQuoteValue }) {
  return (
    <div>
      <CaseLabel>1 · Grote foto → D</CaseLabel>
      <VariantD v={v} />
      <CaseLabel>2 · Kleine foto (portret) → donkere kaart</CaseLabel>
      <DarkCard v={v} photoUrl={SMALL_PHOTO} />
      <CaseLabel>3 · Geen foto → donkere kaart met initiaal</CaseLabel>
      <DarkCard v={v} />
    </div>
  );
}

export function ProtoPullQuote({ value }: { value: ProtoPullQuoteValue }) {
  // URL is the store: server renders A, the client reads ?variant=.
  const variant = useSyncExternalStore(
    subscribe,
    readVariant,
    (): Variant => "A",
  );

  const go = (delta: number) => {
    const i = VARIANTS.indexOf(variant);
    const next = VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length]!;
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url.toString());
    window.dispatchEvent(new Event(EVENT));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const Body = {
    A: VariantA,
    B: VariantB,
    C: VariantC,
    D: VariantD,
    E: VariantE,
  }[variant];

  return (
    <div data-proto-2517-variant={variant}>
      <Body v={value} />
      {process.env.NODE_ENV !== "production" && (
        <div className="bg-ink outline-cream text-label text-cream fixed bottom-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-full px-3 py-2 font-mono font-bold tracking-wide shadow-2xl outline-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Vorige variant"
            className="px-2 text-base leading-none"
          >
            ‹
          </button>
          <span className="whitespace-nowrap">
            #2517 · {variant} — {NAMES[variant]}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Volgende variant"
            className="px-2 text-base leading-none"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
