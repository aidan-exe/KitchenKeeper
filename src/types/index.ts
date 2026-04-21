export interface Ingredient {
  name: string
  amount: string
  unit: string
}

export interface InstructionStep {
  step: number
  text: string
  timerMinutes?: number
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  ingredients: Ingredient[]
  instructions: InstructionStep[]
  prep_time: number | null
  cook_time: number | null
  servings: number
  photo_url: string | null
  source_url: string | null
  tags: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export type RecipeInsert = Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type RecipeUpdate = Partial<RecipeInsert>

export interface GroceryItem {
  name: string
  amount: string
  unit: string
  category: string
  checked: boolean
}

export interface GroceryList {
  id: string
  user_id: string
  name: string
  items: GroceryItem[]
  recipe_ids: string[]
  created_at: string
}

export type GroceryListInsert = Omit<GroceryList, 'id' | 'user_id' | 'created_at'>

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}
