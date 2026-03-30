/**
 * Icon System - Lucide React
 *
 * Centralized icon configuration using Lucide React.
 * Professional outline icons with consistent stroke weight.
 *
 * @see https://lucide.dev
 */

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

  // Social
  Facebook,
  Twitter,
  Instagram,

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

  // Misc
  Plus,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

  // Social
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,

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

  // Social
  Facebook,
  Twitter,
  Instagram,

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

  // Misc
  Plus,
  Zap,
  type LucideIcon,
};
