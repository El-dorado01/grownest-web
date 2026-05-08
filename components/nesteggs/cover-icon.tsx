// components/nesteggs/cover-icon.tsx
// To swap to images later: replace the lucide component map with image URLs
// and render <img src={COVER_IMAGE_MAP[name]} /> instead of <Icon />.

import {
  Laptop, Car, Home, Plane, GraduationCap, Heart, Smartphone,
  Bike, Camera, Gamepad2, Dumbbell, Music, ShoppingBag, Utensils,
  Stethoscope, Briefcase, TrendingUp, Siren, Baby, PawPrint, Gift,
  Sofa, Microwave, Shirt, Diamond, BookOpen, Trophy, Watch,
  Headphones, Monitor, Tablet, Tv, Wheat, Building2, Zap, Bus,
  ShieldCheck, Sunrise, HeartHandshake, Egg,
  type LucideProps,
} from "lucide-react"
import type { FC } from "react"

type LucideIcon = FC<LucideProps>

const ICON_MAP: Record<string, LucideIcon> = {
  laptop:     Laptop,
  car:        Car,
  house:      Home,
  vacation:   Plane,
  education:  GraduationCap,
  wedding:    Heart,
  phone:      Smartphone,
  bike:       Bike,
  bicycle:    Bike,
  camera:     Camera,
  gaming:     Gamepad2,
  fitness:    Dumbbell,
  music:      Music,
  shopping:   ShoppingBag,
  food:       Utensils,
  medical:    Stethoscope,
  business:   Briefcase,
  investment: TrendingUp,
  emergency:  Siren,
  baby:       Baby,
  pet:        PawPrint,
  gift:       Gift,
  furniture:  Sofa,
  appliance:  Microwave,
  clothes:    Shirt,
  jewelry:    Diamond,
  books:      BookOpen,
  sports:     Trophy,
  watch:      Watch,
  headphones: Headphones,
  computer:   Monitor,
  tablet:     Tablet,
  tv:         Tv,
  rice:       Wheat,
  rent:       Building2,
  utility:    Zap,
  transport:  Bus,
  insurance:  ShieldCheck,
  retirement: Sunrise,
  charity:    HeartHandshake,
}

interface CoverIconProps extends LucideProps {
  name: string | null | undefined
}

/** Renders the Lucide icon for a cover name. Falls back to Egg for unknown/null. */
export function CoverIcon({ name, ...props }: CoverIconProps) {
  const Icon = (name && ICON_MAP[name]) ?? Egg
  return <Icon {...props} />
}

/** Full list for the cover picker UI — name, label, and icon component. */
export const COVER_PICKER_LIST: Array<{ name: string; label: string; Icon: LucideIcon }> = [
  { name: "house",      label: "House",       Icon: Home },
  { name: "car",        label: "Car",          Icon: Car },
  { name: "laptop",     label: "Laptop",       Icon: Laptop },
  { name: "vacation",   label: "Vacation",     Icon: Plane },
  { name: "education",  label: "Education",    Icon: GraduationCap },
  { name: "wedding",    label: "Wedding",      Icon: Heart },
  { name: "phone",      label: "Phone",        Icon: Smartphone },
  { name: "bike",       label: "Motorcycle",   Icon: Bike },
  { name: "bicycle",    label: "Bicycle",      Icon: Bike },
  { name: "camera",     label: "Camera",       Icon: Camera },
  { name: "gaming",     label: "Gaming",       Icon: Gamepad2 },
  { name: "fitness",    label: "Fitness",      Icon: Dumbbell },
  { name: "music",      label: "Music",        Icon: Music },
  { name: "shopping",   label: "Shopping",     Icon: ShoppingBag },
  { name: "food",       label: "Food",         Icon: Utensils },
  { name: "medical",    label: "Medical",      Icon: Stethoscope },
  { name: "business",   label: "Business",     Icon: Briefcase },
  { name: "investment", label: "Investment",   Icon: TrendingUp },
  { name: "emergency",  label: "Emergency",    Icon: Siren },
  { name: "baby",       label: "Baby",         Icon: Baby },
  { name: "pet",        label: "Pet",          Icon: PawPrint },
  { name: "gift",       label: "Gift",         Icon: Gift },
  { name: "furniture",  label: "Furniture",    Icon: Sofa },
  { name: "appliance",  label: "Appliance",    Icon: Microwave },
  { name: "clothes",    label: "Clothes",      Icon: Shirt },
  { name: "jewelry",    label: "Jewelry",      Icon: Diamond },
  { name: "books",      label: "Books",        Icon: BookOpen },
  { name: "sports",     label: "Sports",       Icon: Trophy },
  { name: "watch",      label: "Watch",        Icon: Watch },
  { name: "headphones", label: "Headphones",   Icon: Headphones },
  { name: "computer",   label: "Computer",     Icon: Monitor },
  { name: "tablet",     label: "Tablet",       Icon: Tablet },
  { name: "tv",         label: "Television",   Icon: Tv },
  { name: "rice",       label: "Rice/Food",    Icon: Wheat },
  { name: "rent",       label: "Rent",         Icon: Building2 },
  { name: "utility",    label: "Utilities",    Icon: Zap },
  { name: "transport",  label: "Transport",    Icon: Bus },
  { name: "insurance",  label: "Insurance",    Icon: ShieldCheck },
  { name: "retirement", label: "Retirement",   Icon: Sunrise },
  { name: "charity",    label: "Charity",      Icon: HeartHandshake },
]
