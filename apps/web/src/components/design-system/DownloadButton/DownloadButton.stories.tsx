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
          "Polished download button for file attachments. Auto-detects file type, icon, accent color, and display label from URL when props are omitted.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["card", "inline"],
    },
    fileSize: {
      control: "number",
    },
    mimeType: {
      control: "text",
    },
  },
} satisfies Meta<typeof DownloadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
    variant: "card",
  },
};

export const Pdf: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
  },
};

export const Word: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/huishoudelijk-reglement-b2c3d4e5.docx",
    label: "Huishoudelijk reglement",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 98_304,
  },
};

export const Excel: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/ledenlijst-c3d4e5f6.xlsx",
    label: "Ledenlijst seizoen 2024-2025",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 512_000,
  },
};

export const Zip: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/fotos-tornooi-d4e5f6g7.zip",
    label: "Foto's jeugdtornooi",
    mimeType: "application/zip",
    fileSize: 4_200_000,
  },
};

export const NoSizeInfo: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/document-e5f6g7h8.pdf",
    label: "Document zonder grootte-info",
    mimeType: "application/pdf",
  },
  parameters: {
    docs: {
      description: {
        story: "File size badge is hidden when no fileSize prop is provided.",
      },
    },
  },
};

export const LongLabel: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/lang-document-f6g7h8i9.pdf",
    label:
      "Dit is een heel lang label dat meer dan zestig karakters bevat om te testen of de truncatie correct werkt",
    mimeType: "application/pdf",
    fileSize: 1_200_000,
  },
  parameters: {
    docs: {
      description: {
        story: "Long labels are truncated with ellipsis via CSS truncate.",
      },
    },
  },
};

export const WithDescription: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/aangifte-g7h8i9j0.pdf",
    label: "Aangifte Jeugd 2024-2025",
    mimeType: "application/pdf",
    fileSize: 245_600,
    description: "Inschrijvingsformulier voor nieuwe jeugdspelers",
  },
};

export const Inline: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/reglement-h8i9j0k1.pdf",
  },
  render: () => (
    <p className="text-base text-gray-700">
      Raadpleeg het{" "}
      <DownloadButton
        href="https://cdn.sanity.io/files/abc/production/reglement-h8i9j0k1.pdf"
        label="huishoudelijk reglement"
        mimeType="application/pdf"
        fileSize={1_200_000}
        variant="inline"
      />{" "}
      voor meer informatie over de clubregels.
    </p>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Inline variant flows within paragraph text for in-prose references.",
      },
    },
  },
};

export const UrlOnly: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Only href provided — file type, label, and subtitle are all auto-detected from the URL.",
      },
    },
  },
};

export const Group: Story = {
  args: {
    href: "https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf",
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <DownloadButton
        href="https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf"
        label="Aangifte Jeugd 2024-2025"
        mimeType="application/pdf"
        fileSize={245_600}
      />
      <DownloadButton
        href="https://cdn.sanity.io/files/abc/production/reglement-b2c3d4e5.docx"
        label="Huishoudelijk reglement"
        mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        fileSize={98_304}
      />
      <DownloadButton
        href="https://cdn.sanity.io/files/abc/production/ledenlijst-c3d4e5f6.xlsx"
        label="Ledenlijst"
        mimeType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        fileSize={512_000}
      />
      <DownloadButton
        href="https://cdn.sanity.io/files/abc/production/fotos-d4e5f6g7.zip"
        label="Foto's jeugdtornooi"
        mimeType="application/zip"
        fileSize={4_200_000}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple download buttons stacked — mimics the downloads page.",
      },
    },
  },
};
