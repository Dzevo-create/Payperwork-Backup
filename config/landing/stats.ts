import { Clock, TrendingUp, Users, Sparkles } from "lucide-react";

export const LANDING_STATS = [
  {
    icon: Clock,
    value: "95%",
    label: "Zeitersparnis",
    description: "Im Vergleich zu traditioneller 3D-Software",
  },
  {
    icon: TrendingUp,
    value: "10x",
    label: "Mehr Projekte",
    description: "Bearbeite mehr Projekte in der gleichen Zeit",
  },
  {
    icon: Users,
    value: "5.000+",
    label: "Architekten",
    description: "Vertrauen bereits auf Payperwork",
  },
  {
    icon: Sparkles,
    value: "<30s",
    label: "Durchschnitt",
    description: "Vom Upload zum fertigen Rendering",
  },
] as const;

export const STATS_IMAGES = [
  '/images/Pictures/Fotos/georgi-kalaydzhiev-Bnag6fJ1pHo-unsplash.jpg',
  '/images/Pictures/Fotos/maximilian-jaenicke-wOtTh39V83g-unsplash.jpg',
  '/images/Pictures/Fotos/max-harlynking-PGoEi8jL5BA-unsplash.jpg',
  '/images/Pictures/Fotos/adrian-pelletier-QHJytUzTEkU-unsplash.jpg'
] as const;

export const STATS_COLORS = ['#a3a8a2', '#242424', '#a3a8a2', '#242424'] as const;
