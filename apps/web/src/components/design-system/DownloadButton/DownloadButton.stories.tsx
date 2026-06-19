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
          "Phase 5 redesign (#1849) — TapedCard + stenciled corner stamp + jersey-deep CTA per `fileattachment-htmltable-locked.md §5.1`. Press-down hover on the whole anchor.",
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
  },
};

// ─── File-type palette ─────────────────────────────────────────────────────

export const CardPdf: Story = {
  name: "Card — PDF",
  args: {
    href: "https://files.example.com/aangifte-jeugd-a1b2c3d4.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
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
  },
};

export const CardAudio: Story = {
  name: "Card — Audio (MP3)",
  args: {
    href: "https://files.example.com/clubpodcast-d4e5f6g7.mp3",
    label: "Clubpodcast Aflevering 3",
    mimeType: "audio/mpeg",
    fileSize: 8_400_000,
  },
};

export const CardVideo: Story = {
  name: "Card — Video (MP4)",
  args: {
    href: "https://files.example.com/highlights-e5f6g7h8.mp4",
    label: "Wedstrijdhighlights",
    mimeType: "video/mp4",
    fileSize: 25_600_000,
  },
};

export const CardZip: Story = {
  name: "Card — ZIP",
  args: {
    href: "https://files.example.com/fotos-tornooi-f6g7h8i9.zip",
    label: "Foto's jeugdtornooi",
    mimeType: "application/zip",
    fileSize: 4_200_000,
  },
};

export const CardOther: Story = {
  name: "Card — Other (unrecognised)",
  args: {
    href: "https://files.example.com/bijlage-g7h8i9j0.dat",
    label: "Onbekend bestand",
  },
};

export const CardNoSize: Story = {
  name: "Card — no size",
  args: {
    href: "https://files.example.com/document-h8i9j0k1.pdf",
    label: "Document zonder grootte-info",
    mimeType: "application/pdf",
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
  },
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
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
