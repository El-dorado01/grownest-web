// lib/nestegg-covers.ts
// Maps backend cover name strings → display emoji.
// To switch to images later: replace the emoji strings with image URLs
// and render <img src={getCoverDisplay(name)} /> instead of the emoji span.

export const COVER_MAP: Record<string, { emoji: string; label: string }> = {
  laptop:     { emoji: "💻", label: "Laptop" },
  car:        { emoji: "🚗", label: "Car" },
  house:      { emoji: "🏠", label: "House" },
  vacation:   { emoji: "✈️", label: "Vacation" },
  education:  { emoji: "🎓", label: "Education" },
  wedding:    { emoji: "💍", label: "Wedding" },
  phone:      { emoji: "📱", label: "Phone" },
  bike:       { emoji: "🏍️", label: "Motorcycle" },
  bicycle:    { emoji: "🚲", label: "Bicycle" },
  camera:     { emoji: "📷", label: "Camera" },
  gaming:     { emoji: "🎮", label: "Gaming" },
  fitness:    { emoji: "🏋️", label: "Fitness" },
  music:      { emoji: "🎵", label: "Music" },
  shopping:   { emoji: "🛍️", label: "Shopping" },
  food:       { emoji: "🍽️", label: "Food" },
  medical:    { emoji: "🏥", label: "Medical" },
  business:   { emoji: "💼", label: "Business" },
  investment: { emoji: "📈", label: "Investment" },
  emergency:  { emoji: "🚨", label: "Emergency" },
  baby:       { emoji: "👶", label: "Baby" },
  pet:        { emoji: "🐾", label: "Pet" },
  gift:       { emoji: "🎁", label: "Gift" },
  furniture:  { emoji: "🪑", label: "Furniture" },
  appliance:  { emoji: "🍳", label: "Appliance" },
  clothes:    { emoji: "👗", label: "Clothes" },
  jewelry:    { emoji: "💎", label: "Jewelry" },
  books:      { emoji: "📚", label: "Books" },
  sports:     { emoji: "⚽", label: "Sports" },
  watch:      { emoji: "⌚", label: "Watch" },
  headphones: { emoji: "🎧", label: "Headphones" },
  computer:   { emoji: "🖥️", label: "Computer" },
  tablet:     { emoji: "📟", label: "Tablet" },
  tv:         { emoji: "📺", label: "Television" },
  rice:       { emoji: "🍚", label: "Rice/Food" },
  rent:       { emoji: "🏢", label: "Rent" },
  utility:    { emoji: "⚡", label: "Utilities" },
  transport:  { emoji: "🚌", label: "Transport" },
  insurance:  { emoji: "🛡️", label: "Insurance" },
  retirement: { emoji: "👴", label: "Retirement" },
  charity:    { emoji: "🤲", label: "Charity" },
}

/** Returns the emoji for a cover name. Falls back to 🥚 for unknown/null values. */
export function getCoverEmoji(name: string | null | undefined): string {
  if (!name) return "🥚"
  return COVER_MAP[name]?.emoji ?? name // if it's already an emoji, return as-is
}

/** Returns the label for a cover name. Falls back to the raw string. */
export function getCoverLabel(name: string | null | undefined): string {
  if (!name) return "Goal"
  return COVER_MAP[name]?.label ?? name
}

/** All covers as an ordered array for the picker UI */
export const COVER_LIST = Object.entries(COVER_MAP).map(([name, { emoji, label }]) => ({
  name,
  emoji,
  label,
}))
