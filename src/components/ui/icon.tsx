import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Award,
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
  Clock,
  Coffee,
  CreditCard,
  Droplets,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Ghost,
  Globe,
  Heart,
  House,
  List,
  Lock,
  LogOut,
  Mail,
  Map,
  MapPin,
  MessageCircleMore,
  Minus,
  Moon,
  Mountain,
  PawPrint,
  Plus,
  Search,
  Settings,
  Share,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  TreePalm,
  TreePine,
  Trees,
  User,
  Upload,
  Waves,
  Wifi,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

import { iconTokens } from "@/theme";
import { useThemeColors } from "@/theme/use-theme-colors";

const iconMap = {
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight,
  award: Award,
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
  clock: Clock,
  coffee: Coffee,
  creditCard: CreditCard,
  droplets: Droplets,
  eye: Eye,
  eyeOff: EyeOff,
  fileText: FileText,
  flame: Flame,
  ghost: Ghost,
  globe: Globe,
  heart: Heart,
  house: House,
  list: List,
  lock: Lock,
  logOut: LogOut,
  mail: Mail,
  map: Map,
  mapPin: MapPin,
  messageCircleMore: MessageCircleMore,
  minus: Minus,
  moon: Moon,
  mountain: Mountain,
  pawPrint: PawPrint,
  plus: Plus,
  search: Search,
  settings: Settings,
  share: Share,
  shield: Shield,
  slidersHorizontal: SlidersHorizontal,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  treePalm: TreePalm,
  treePine: TreePine,
  trees: Trees,
  user: User,
  upload: Upload,
  waves: Waves,
  wifi: Wifi,
  wind: Wind,
  x: X,
  zap: Zap,
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
