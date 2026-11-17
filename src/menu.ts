import snapshot from './qdoba-menu.json'

export const categories = ['All items', 'Entrées', 'Sides', 'Drinks', 'Desserts'] as const
export type Category = typeof categories[number]

export type Portion = { foodId: string; quantity: number }
type Variant = { foods: Portion[]; possibleFoods: Portion[] }
export type MenuItem = Variant & {
  id: string
  name: string
  category: string
  sizes: (Variant & { name: string })[]
}

export type MealItem = {
  key: number
  item: MenuItem
  size: number
  servings: number
  portions: Portion[]
}

export const foods: Record<string, { name: string; servingSize: string; nutritionFacts: Record<string, number> }> = snapshot.foods

const featured = ['Create Your Own Bowl', 'Chicken Queso Bowl', 'Create Your Own Burrito',
  'Street Style Chicken Tacos', 'Steak Fajita Quesadilla', 'Hand-Crafted Guacamole & Chips',
  'Jarritos Pineapple', 'Chocolate Chunk Cookie']

export const menu: MenuItem[] = [...snapshot.items].sort((a, b) => {
  const rank = (item: MenuItem) => {
    const index = featured.indexOf(item.name)
    return index === -1 ? featured.length + categories.indexOf(item.category as Category) : index
  }
  return rank(a) - rank(b) || a.name.localeCompare(b.name)
})

export function variantFor(item: MenuItem, size: number): Variant {
  return item.sizes[size] ?? item
}

export function isCustomizable(item: MenuItem) {
  return item.sizes.length > 0 || item.possibleFoods.length > 0 || item.foods.length > 1
}

export function newMealItem(item: MenuItem, key: number): MealItem {
  return { key, item, size: 0, servings: 1, portions: variantFor(item, 0).foods }
}

// Daily Values from the FDA's Nutrition and Supplement Facts reference table.
export const nutrients = [
  { key: 'fat', name: 'Total Fat', unit: 'g', daily: 78 },
  { key: 'saturatedFat', name: 'Saturated Fat', unit: 'g', daily: 20, indent: 1 },
  { key: 'cholesterol', name: 'Cholesterol', unit: 'mg', daily: 300 },
  { key: 'sodium', name: 'Sodium', unit: 'mg', daily: 2300 },
  { key: 'carbs', name: 'Total Carbohydrate', unit: 'g', daily: 275 },
  { key: 'dietaryFiber', name: 'Dietary Fiber', unit: 'g', daily: 28, indent: 1 },
  { key: 'sugar', name: 'Total Sugars', unit: 'g', indent: 1 },
  { key: 'addedSugars', name: 'Added Sugars', unit: 'g', daily: 50, indent: 2, optional: true },
  { key: 'protein', name: 'Protein', unit: 'g', daily: 50 },
  { key: 'calcium', name: 'Calcium', unit: 'mg', daily: 1300, optional: true },
  { key: 'iron', name: 'Iron', unit: 'mg', daily: 18, optional: true },
] as const satisfies readonly {
  key: string; name: string; unit: string; daily?: number; indent?: number; optional?: boolean
}[]

export function mealNutrition(meal: MealItem[]) {
  const portions = meal.flatMap(({ portions, servings }) =>
    portions.map(({ foodId, quantity }) => ({ facts: foods[foodId].nutritionFacts, quantity: quantity * servings })),
  )

  return Object.fromEntries(['calories', 'caloriesFromFat', ...nutrients.map(({ key }) => key)].map(key => {
    let total = 0
    for (const { facts, quantity } of portions) {
      const amount = facts[key]
      if (!Number.isFinite(amount) || amount < 0) return [key, null]
      total += amount * quantity
    }
    return [key, total]
  })) as Record<string, number | null>
}

export const formatNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format
export const caloriesText = (amount: number | null) => amount === null ? '—' : formatNumber(Math.round(amount))
export const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
