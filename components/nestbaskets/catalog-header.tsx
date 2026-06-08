import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { categoriesList } from "./utils"

interface CatalogHeaderProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  selectedBrand: string
  setSelectedBrand: (val: string) => void
  uniqueBrands: string[]
  selectedCategory: string
  setSelectedCategory: (val: string) => void
}

export function CatalogHeader({
  searchQuery,
  setSearchQuery,
  selectedBrand,
  setSelectedBrand,
  uniqueBrands,
  selectedCategory,
  setSelectedCategory,
}: CatalogHeaderProps) {
  return (
    <div className="sticky top-0 z-10 space-y-4 border-b border-border/30 bg-background p-5 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Custom Basket Builder
        </h1>
        <p className="text-sm text-muted-foreground">
          Select your preferred groceries from our active farm
          inventory. Adjust quantities to build your personalized weekly
          or monthly food bundle.
        </p>
      </div>

      {/* Search & Brand Controls */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search food items or brands..."
            className="h-11 w-full rounded-2xl border-muted pl-9 text-sm focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="h-11! w-full shrink-0 cursor-pointer rounded-2xl border border-muted bg-card px-4 py-0 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none sm:w-48">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands
              .filter((b) => b !== "all")
              .map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter Tabs */}
      <div className="scrollbar-none flex w-full gap-2 overflow-x-auto border-t border-border/40 pt-3 pb-1">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2 text-xs font-bold capitalize transition-all",
              selectedCategory === cat
                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>
    </div>
  )
}
