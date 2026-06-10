import { FoodItem } from "@/types/nestbaskets"

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

export function getCategoryForFoodItem(item: FoodItem): string {
  const name = item.name.toLowerCase();
  const desc = (item.description || "").toLowerCase();
  const brand = (item.brand || "").toLowerCase();

  const textToSearch = `${name} ${desc} ${brand}`;

  // 1. Cleaners & Toiletries
  if (
    /\b(soap|detergent|cleaner|cleansers?|bleach|hygiene|disinfectant|wipe|wipes|hypo|harpic|dettol|klin|ariel|sunlight|tissue|shaving|toilet|wash|cleanser)\b/i.test(textToSearch) ||
    /morning\s+fresh|mama\s+lemon/i.test(textToSearch)
  ) {
    return "Cleaners & Toiletries";
  }

  // 2. Beverages & Dairy
  if (
    /\b(milk|milo|drink|drinks|beverage|beverages|juice|juices|soda|sodas|tea|coffee|cocoa|yoghurt|yogurt|malt|malts|bournvita|ovaline|fanta|coke|pepsi|sprite|schweppes|origin|heineken|beer|goldberg|hero|loya|milksi|chivita|lucozade|hollandia|peak|nescafe|vitamilk|caprisun|five\s+alive|5\s+alive|happy\s+hour|star\s+can|double\s+black|double\s+white|maltina|amstel|dubic|gulder|alomo|alcoholic|liqueur|wine|spirit|water|aquafina|eva|nestle)\b/i.test(textToSearch) ||
    /\b(can|cans)\b/i.test(name)
  ) {
    return "Beverages & Dairy";
  }

  // 3. Noodles & Pasta
  if (
    /\b(spaghetti|pasta|indomie|noodle|noodles|macaroni|couscous|vermicelli|minimie)\b/i.test(textToSearch)
  ) {
    return "Noodles & Pasta";
  }

  // 4. Grains & Tubers
  if (
    /\b(rice|garri|semovita|flour|flours|yam|yams|potato|potatoes|semolina|wheat|oat|oats|cornflakes|custard|cereal|cereals|nasco|checkers|quaker|maize|corn|golden\s+morn)\b/i.test(textToSearch)
  ) {
    return "Grains & Tubers";
  }

  // 5. Canned & Condiments
  if (
    /\b(tomato|tomatoes|sardine|sardines|beef|canned|sugar|salt|pepper|spice|spices|seasoning|seasonings|curry|maggi|ketchup|mayo|mayonnaise|sauce|sauces|paste|pastes|bouillon|cube|cubes|knorr|royco|redsarsa|gino|derica|titus|geisha|sparc|egg|eggs|sweetener|mustard|vinegar|chili|cayenne|ginger|garlic|thyme|rosemary|nutmeg|turmeric|onion|onions)\b/i.test(textToSearch)
  ) {
    return "Canned & Condiments";
  }

  // 6. Oils & Fats
  if (
    /\b(oil|oils|butter|butters|margarine|margarines|spread|spreads|fat|fats|mamador|veg\s+oil|cooking\s+oil|palm\s+oil|soya\s+oil|soybean\s+oil|groundnut\s+oil|vegetable\s+oil|lard|tallow)\b/i.test(textToSearch) ||
    /\bdevon\s+kings?\b/i.test(textToSearch) ||
    /\bkings?\s+oil\b/i.test(textToSearch)
  ) {
    return "Oils & Fats";
  }

  // 7. Legumes & Seeds
  if (
    /\b(beans|bean|legumes|legume|seeds|seed|groundnuts|groundnut|cashews|cashew|peanuts|peanut|peas|pea|melon|egusi|lentils|cowpea)\b/i.test(textToSearch)
  ) {
    return "Legumes & Seeds";
  }

  return "Others";
}

export const categoriesList = [
  "all",
  "Grains & Tubers",
  "Legumes & Seeds",
  "Oils & Fats",
  "Noodles & Pasta",
  "Beverages & Dairy",
  "Canned & Condiments",
  "Cleaners & Toiletries",
  "Others"
];
