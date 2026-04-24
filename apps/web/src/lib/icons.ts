/**
 * Icon System - Lucide React
 *
 * Centralized icon configuration using Lucide React.
 * Professional outline icons with consistent stroke weight.
 *
 * @see https://lucide.dev
 */

import {
  FacebookBrandIcon as Facebook,
  InstagramBrandIcon as Instagram,
} from "@/components/design-system/Icon/BrandIcons";
import {
  // Navigation & UI
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Check,
  CircleHelp,

  // Status & Feedback
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  ThumbsDown,

  // Social (Facebook + Instagram brand logos come from ./BrandIcons —
  // Lucide v1 dropped its brand exports for trademark reasons.)
  Share2,

  // Content & Document
  FileText,
  Clipboard,
  ClipboardList,
  Newspaper,
  Tag,
  Calendar,
  CalendarDays,
  Clock,
  Ticket,
  Coffee,

  // Communication
  Mail,
  Phone,
  Smartphone,
  MessageCircle,

  // People & Organization
  User,
  Users,
  UserPlus,
  GraduationCap,

  // Location & Measurement
  MapPin,
  CircleParking,

  // Accessibility
  Accessibility,

  // Sports & Activities
  Trophy,
  Activity,
  CircleDot,
  Flag,
  Timer,
  RectangleVertical,
  Square,

  // Medical & Safety
  Heart,
  Shield,

  // Business
  Handshake,

  // Layout & Views
  LayoutGrid,
  Network,

  // Media controls
  Pause,
  Play,

  // Zoom & Viewport
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Expand,
  Minimize,

  // Actions
  Download,

  // Misc
  Plus,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Re-export BrandIcons under their Lucide-compatible names. `icons.facebook`,
// `icons.instagram`, and the named `Facebook`/`Instagram` exports below
// continue to work for every call site that used them pre-v1.
export { Facebook, Instagram };

/**
 * Icon components map
 * Used to get icon component by name string
 */
export const icons = {
  // Navigation & UI
  menu: Menu,
  x: X,
  search: Search,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "arrow-right": ArrowRight,
  "external-link": ExternalLink,
  check: Check,
  "circle-help": CircleHelp,

  // Status & Feedback
  info: Info,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  "x-circle": XCircle,
  "thumbs-up": ThumbsUp,
  "thumbs-down": ThumbsDown,

  // Social (Facebook/Instagram are inline-SVG brand components — see ./BrandIcons)
  facebook: Facebook,
  instagram: Instagram,
  share: Share2,

  // Content & Document
  "file-text": FileText,
  clipboard: Clipboard,
  "clipboard-list": ClipboardList,
  newspaper: Newspaper,
  tag: Tag,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  clock: Clock,

  // Communication
  mail: Mail,
  phone: Phone,
  smartphone: Smartphone,
  "message-circle": MessageCircle,

  // People & Organization
  user: User,
  users: Users,
  "user-plus": UserPlus,
  "graduation-cap": GraduationCap,

  // Location & Measurement
  "map-pin": MapPin,
  "circle-parking": CircleParking,

  // Accessibility
  accessibility: Accessibility,

  // Content & Document (additional)
  ticket: Ticket,
  coffee: Coffee,

  // Sports & Activities
  trophy: Trophy,
  activity: Activity,
  "circle-dot": CircleDot,
  flag: Flag,
  timer: Timer,
  "rectangle-vertical": RectangleVertical,
  square: Square,

  // Medical & Safety
  heart: Heart,
  shield: Shield,

  // Business
  handshake: Handshake,

  // Layout & Views
  "layout-grid": LayoutGrid,
  network: Network,

  // Media controls
  pause: Pause,
  play: Play,

  // Zoom & Viewport
  "zoom-in": ZoomIn,
  "zoom-out": ZoomOut,
  maximize2: Maximize2,
  minimize2: Minimize2,
  expand: Expand,
  minimize: Minimize,

  // Actions
  download: Download,

  // Misc
  plus: Plus,
  zap: Zap,
} as const;

export type IconName = keyof typeof icons;

/**
 * Get icon component by name with fallback
 * @param name - Icon name from IconName type
 * @returns Lucide icon component, or CircleHelp as fallback if name is invalid
 */
export function getIcon(name: string): LucideIcon {
  // Type-safe lookup with fallback for runtime safety
  const icon = icons[name as IconName];
  if (!icon) {
    console.warn(`Icon "${name}" not found, using fallback icon`);
    return CircleHelp;
  }
  return icon;
}

/**
 * Responsibility category icon mapping
 * Maps category to appropriate Lucide icon
 */
export const categoryIcons = {
  commercieel: "handshake",
  medisch: "heart",
  administratief: "file-text",
  gedrag: "shield",
  algemeen: "users",
  sportief: "trophy",
} as const satisfies Record<string, IconName>;

/**
 * Emoji to Lucide icon mapping
 * Used for backward compatibility during migration
 */
export const emojiToIcon = {
  "🤝": "handshake",
  "💪": "zap",
  "📝": "file-text",
  "⚽": "trophy",
  "📋": "clipboard-list",
  "🛡️": "shield",
  "🏥": "heart",
  "📱": "smartphone",
  "👤": "user",
  "🎓": "graduation-cap",
  "📅": "calendar",
  "🔍": "search",
} as const satisfies Record<string, IconName>;

/**
 * Export all icons for direct use
 */
export {
  // Navigation & UI
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Check,
  CircleHelp,

  // Status & Feedback
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  ThumbsDown,

  // Social (Facebook + Instagram re-exported at the top of the file from ./BrandIcons)
  Share2,

  // Content & Document
  FileText,
  Clipboard,
  ClipboardList,
  Newspaper,
  Tag,
  Calendar,
  CalendarDays,
  Clock,

  // Communication
  Mail,
  Phone,
  Smartphone,
  MessageCircle,

  // People & Organization
  User,
  Users,
  UserPlus,
  GraduationCap,

  // Location & Measurement
  MapPin,
  CircleParking,

  // Accessibility
  Accessibility,

  // Content & Document (additional)
  Ticket,
  Coffee,

  // Sports & Activities
  Trophy,
  Activity,
  CircleDot,
  Flag,
  Timer,
  RectangleVertical,
  Square,

  // Medical & Safety
  Heart,
  Shield,

  // Business
  Handshake,

  // Layout & Views
  LayoutGrid,
  Network,

  // Media controls
  Pause,
  Play,

  // Zoom & Viewport
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Expand,
  Minimize,

  // Actions
  Download,

  // Misc
  Plus,
  Zap,
  type LucideIcon,
};
