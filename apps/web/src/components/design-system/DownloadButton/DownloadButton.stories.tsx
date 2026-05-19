import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadButton } from "./DownloadButton";

const meta = {
  title: "UI/DownloadButton",
  component: DownloadButton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 5 redesign (#1849) — `card` (TapedCard + stenciled corner stamp + jersey-deep CTA) and `inline` (chip) variants per `fileattachment-htmltable-locked.md §5.1`. Press-down hover on the whole anchor.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream max-w-[720px] p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["card", "inline"],
    },
    fileSize: { control: "number" },
    mimeType: { control: "text" },
  },
} satisfies Meta<typeof DownloadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    href: "https://files.example.com/trainingsschema-a1b2c3d4.pdf",
    label: "Trainingsschema seizoen 2025-2026",
    mimeType: "application/pdf",
    fileSize: 1_400_000,
    variant: "card",
  },
};

// ─── Card variant — file-type palette ─────────────────────────────────────

export const CardPdf: Story = {
  name: "Card — PDF",
  args: {
    href: "https://files.example.com/aangifte-jeugd-a1b2c3d4.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
    variant: "card",
  },
};

export const CardWord: Story = {
  name: "Card — Word (DOCX)",
  args: {
    href: "https://files.example.com/huishoudelijk-reglement-b2c3d4e5.docx",
    label: "Huishoudelijk reglement",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 98_304,
    variant: "card",
  },
};

export const CardExcel: Story = {
  name: "Card — Excel (XLSX)",
  args: {
    href: "https://files.example.com/ledenlijst-c3d4e5f6.xlsx",
    label: "Ledenlijst seizoen 2024-2025",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 512_000,
    variant: "card",
  },
};

export const CardAudio: Story = {
  name: "Card — Audio (MP3)",
  args: {
    href: "https://files.example.com/clubpodcast-d4e5f6g7.mp3",
    label: "Clubpodcast Aflevering 3",
    mimeType: "audio/mpeg",
    fileSize: 8_400_000,
    variant: "card",
  },
};

export const CardVideo: Story = {
  name: "Card — Video (MP4)",
  args: {
    href: "https://files.example.com/highlights-e5f6g7h8.mp4",
    label: "Wedstrijdhighlights",
    mimeType: "video/mp4",
    fileSize: 25_600_000,
    variant: "card",
  },
};

export const CardZip: Story = {
  name: "Card — ZIP",
  args: {
    href: "https://files.example.com/fotos-tornooi-f6g7h8i9.zip",
    label: "Foto's jeugdtornooi",
    mimeType: "application/zip",
    fileSize: 4_200_000,
    variant: "card",
  },
};

export const CardOther: Story = {
  name: "Card — Other (unrecognised)",
  args: {
    href: "https://files.example.com/bijlage-g7h8i9j0.dat",
    label: "Onbekend bestand",
    variant: "card",
  },
};

export const CardNoSize: Story = {
  name: "Card — no size",
  args: {
    href: "https://files.example.com/document-h8i9j0k1.pdf",
    label: "Document zonder grootte-info",
    mimeType: "application/pdf",
    variant: "card",
  },
};

export const CardWithDescription: Story = {
  name: "Card — with description",
  args: {
    href: "https://files.example.com/aangifte-i9j0k1l2.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
    description: "Inschrijvingsformulier voor nieuwe jeugdspelers.",
    variant: "card",
  },
};

export const CardLongLabel: Story = {
  name: "Card — long label (truncates)",
  args: {
    href: "https://files.example.com/lang-document-j0k1l2m3.pdf",
    label:
      "Dit is een heel lang label dat meer dan zestig karakters bevat om te testen of de truncatie correct werkt op smalle viewports",
    mimeType: "application/pdf",
    fileSize: 1_200_000,
    variant: "card",
  },
};

// ─── Inline variant — file-type palette ───────────────────────────────────

export const InlinePdf: Story = {
  name: "Inline — PDF",
  args: {
    href: "https://files.example.com/reglement-k1l2m3n4.pdf",
    label: "huishoudelijk reglement",
    mimeType: "application/pdf",
    fileSize: 1_200_000,
    variant: "inline",
  },
};

export const InlineWord: Story = {
  name: "Inline — Word",
  args: {
    href: "https://files.example.com/lidmaatschap-l2m3n4o5.docx",
    label: "lidmaatschapsformulier",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    variant: "inline",
  },
};

export const InlineExcel: Story = {
  name: "Inline — Excel",
  args: {
    href: "https://files.example.com/agenda-m3n4o5p6.xlsx",
    label: "kalender 2025",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 96_000,
    variant: "inline",
  },
};

export const InlineAudio: Story = {
  name: "Inline — Audio",
  args: {
    href: "https://files.example.com/clubpodcast-n4o5p6q7.mp3",
    label: "clubpodcast",
    mimeType: "audio/mpeg",
    fileSize: 6_400_000,
    variant: "inline",
  },
};

export const InlineZip: Story = {
  name: "Inline — ZIP",
  args: {
    href: "https://files.example.com/fotos-o5p6q7r8.zip",
    label: "tornooifoto's",
    mimeType: "application/zip",
    fileSize: 4_200_000,
    variant: "inline",
  },
};

export const InlineLongFilename: Story = {
  name: "Inline — long filename (truncates)",
  args: {
    href: "https://files.example.com/dossier-p6q7r8s9.pdf",
    label:
      "complete dossierbundel voor het seizoen 2025-2026 inclusief alle bijlagen",
    mimeType: "application/pdf",
    fileSize: 2_100_000,
    variant: "inline",
  },
};

export const InlineWithinParagraph: Story = {
  name: "Inline — composed in prose",
  args: {
    href: "https://files.example.com/reglement-q7r8s9t0.pdf",
    variant: "inline",
  },
  render: () => (
    <p className="text-ink font-serif text-[16px] leading-[1.55]">
      Raadpleeg het{" "}
      <DownloadButton
        href="https://files.example.com/reglement-q7r8s9t0.pdf"
        label="huishoudelijk reglement"
        mimeType="application/pdf"
        fileSize={1_200_000}
        variant="inline"
      />{" "}
      voor meer informatie over de clubregels.
    </p>
  ),
};

export const CardGroup: Story = {
  name: "Card — group (downloads page mock)",
  args: {
    href: "https://files.example.com/aangifte-r8s9t0u1.pdf",
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <DownloadButton
        href="https://files.example.com/aangifte-r8s9t0u1.pdf"
        label="Aangifte Jeugd 2024-2025"
        mimeType="application/pdf"
        fileSize={245_600}
      />
      <DownloadButton
        href="https://files.example.com/reglement-s9t0u1v2.docx"
        label="Huishoudelijk reglement"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        fileSize={98_304}
      />
      <DownloadButton
        href="https://files.example.com/ledenlijst-t0u1v2w3.xlsx"
        label="Ledenlijst"
        mimeType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        fileSize={512_000}
      />
      <DownloadButton
        href="https://files.example.com/fotos-u1v2w3x4.zip"
        label="Foto's jeugdtornooi"
        mimeType="application/zip"
        fileSize={4_200_000}
      />
    </div>
  ),
};

export const CardMobileNarrow: Story = {
  name: "Card — mobile (375px)",
  args: {
    href: "https://files.example.com/aangifte-v2w3x4y5.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
    variant: "card",
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
