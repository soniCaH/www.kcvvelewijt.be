/**
 * Icon Component Stories
 * Showcases Icon wrapper with Lucide React icons
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Icon } from "./Icon";
import {
  Activity,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Search,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
// Facebook + Instagram come from our inline BrandIcons module — Lucide v1
// dropped the brand-logo exports. The BrandIcons signature is
// LucideIcon-compatible (forwardRef, size/className/...svg props).
import {
  FacebookBrandIcon as Facebook,
  InstagramBrandIcon as Instagram,
} from "./BrandIcons";

const meta = {
  title: "UI/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
      description: "Size of the icon",
    },
    color: {
      control: "select",
      options: [
        "current",
        "primary",
        "secondary",
        "success",
        "warning",
        "error",
        "muted",
      ],
      description: "Color of the icon",
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default icon (Football)
 */
export const Default: Story = {
  args: {
    icon: Activity,
  },
};

/**
 * Primary color (KCVV Green)
 */
export const Primary: Story = {
  args: {
    icon: Trophy,
    color: "primary",
    size: "lg",
  },
};

/**
 * All available sizes
 */
export const AllSizes: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <Icon icon={Activity} size="xs" />
        <div className="mt-2 text-xs text-gray-600">xs</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} size="sm" />
        <div className="mt-2 text-xs text-gray-600">sm</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} size="md" />
        <div className="mt-2 text-xs text-gray-600">md</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} size="lg" />
        <div className="mt-2 text-xs text-gray-600">lg</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} size="xl" />
        <div className="mt-2 text-xs text-gray-600">xl</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} size="2xl" />
        <div className="mt-2 text-xs text-gray-600">2xl</div>
      </div>
    </div>
  ),
};

/**
 * All available colors
 */
export const AllColors: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="flex flex-wrap gap-6">
      <div className="text-center">
        <Icon icon={Activity} color="current" size="xl" />
        <div className="mt-2 text-xs text-gray-600">current</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} color="primary" size="xl" />
        <div className="mt-2 text-xs text-gray-600">primary</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} color="secondary" size="xl" />
        <div className="mt-2 text-xs text-gray-600">secondary</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} color="success" size="xl" />
        <div className="mt-2 text-xs text-gray-600">success</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} color="warning" size="xl" />
        <div className="mt-2 text-xs text-gray-600">warning</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} color="error" size="xl" />
        <div className="mt-2 text-xs text-gray-600">error</div>
      </div>
      <div className="text-center">
        <Icon icon={Activity} color="muted" size="xl" />
        <div className="mt-2 text-xs text-gray-600">muted</div>
      </div>
    </div>
  ),
};

/**
 * Common KCVV icons
 */
export const CommonIcons: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="grid grid-cols-5 gap-4">
      <div className="text-center">
        <Icon icon={Activity} size="lg" color="primary" />
        <div className="mt-2 text-xs text-gray-600">Football</div>
      </div>
      <div className="text-center">
        <Icon icon={Trophy} size="lg" color="primary" />
        <div className="mt-2 text-xs text-gray-600">Trophy</div>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="lg" color="primary" />
        <div className="mt-2 text-xs text-gray-600">Team</div>
      </div>
      <div className="text-center">
        <Icon icon={Calendar} size="lg" color="primary" />
        <div className="mt-2 text-xs text-gray-600">Calendar</div>
      </div>
      <div className="text-center">
        <Icon icon={MapPin} size="lg" color="primary" />
        <div className="mt-2 text-xs text-gray-600">Location</div>
      </div>
    </div>
  ),
};

/**
 * Contact icons
 */
export const ContactIcons: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Phone} size="md" color="secondary" />
      <Icon icon={Mail} size="md" color="secondary" />
    </div>
  ),
};

/**
 * Social media icons
 */
export const SocialIcons: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Facebook} size="lg" color="muted" />
      <Icon icon={Instagram} size="lg" color="muted" />
    </div>
  ),
};

/**
 * Navigation icons
 */
export const NavigationIcons: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="flex items-center gap-4">
      <Icon icon={Search} size="md" />
      <Icon icon={Menu} size="md" />
      <Icon icon={X} size="md" />
      <Icon icon={ArrowRight} size="md" />
      <Icon icon={ChevronDown} size="md" />
    </div>
  ),
};

/**
 * Icons with text
 */
export const WithText: Story = {
  args: { icon: Activity },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon icon={Calendar} size="sm" color="primary" />
        <span>15 Januari 2025</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon icon={MapPin} size="sm" color="primary" />
        <span>Sportcomplex Elewijt</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon icon={Users} size="sm" color="primary" />
        <span>23 Spelers</span>
      </div>
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    icon: Activity,
    size: "md",
    color: "primary",
  },
};
