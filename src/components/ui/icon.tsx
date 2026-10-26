import {
  ArrowRight,
  ArrowUp,
  Bath,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Coffee,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Ghost,
  Globe,
  Heart,
  House,
  List,
  Lock,
  Map,
  MapPin,
  Minus,
  Moon,
  PawPrint,
  Plus,
  Search,
  Settings,
  Share,
  SlidersHorizontal,
  Star,
  Sun,
  TreePalm,
  TreePine,
  User,
  Upload,
  Waves,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { iconTokens } from "@/theme";
import { useThemeColors } from "@/theme/use-theme-colors";

const iconMap = {
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  bath: Bath,
  bookmark: Bookmark,
  briefcase: Briefcase,
  building2: Building2,
  calendarDays: CalendarDays,
  car: Car,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  circleAlert: CircleAlert,
  coffee: Coffee,
  creditCard: CreditCard,
  eye: Eye,
  eyeOff: EyeOff,
  fileText: FileText,
  ghost: Ghost,
  globe: Globe,
  heart: Heart,
  house: House,
  list: List,
  lock: Lock,
  map: Map,
  mapPin: MapPin,
  minus: Minus,
  moon: Moon,
  pawPrint: PawPrint,
  plus: Plus,
  search: Search,
  settings: Settings,
  share: Share,
  slidersHorizontal: SlidersHorizontal,
  star: Star,
  sun: Sun,
  treePalm: TreePalm,
  treePine: TreePine,
  user: User,
  upload: Upload,
  waves: Waves,
  wifi: Wifi,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;
export type IconSize = keyof typeof iconTokens.sizes;

export type IconProps = {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = "md", color, fill = "none", strokeWidth = iconTokens.strokeWidth }: IconProps) {
  const colors = useThemeColors();
  const Glyph = iconMap[name];
  const resolvedSize = typeof size === "number" ? size : iconTokens.sizes[size];

  return (
    <Glyph
      size={resolvedSize}
      color={color ?? colors.foreground}
      fill={fill}
      strokeWidth={strokeWidth}
    />
  );
}
