'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GroceryItem, GroceryListInsert } from '@/types'

// Categorise an ingredient name into a grocery section
function categorise(name: string): string {
  const n = name.toLowerCase()
  if (/chicken|beef|lamb|pork|mince|boerewors|biltong|fish|prawn|tuna/.test(n)) return 'Meat & Fish'
  if (/milk|cheese|butter|cream|yoghurt|egg/.test(n)) return 'Dairy & Eggs'
  if (/onion|garlic|tomato|pepper|carrot|potato|spinach|lettuce|cabbage|mushroom|lemon|lime|avocado/.test(n)) return 'Produce'
  if (/flour|sugar|salt|pepper|oil|vinegar|baking|yeast|cornflour|maizena/.test(n)) return 'Pantry'
  if (/rice|pasta|noodle|bread|roti|pap|samp/.test(n)) return 'Grains & Bread'
  if (/sauce|stock|broth|paste|tin|can|coconut/.test(n)) return 'Canned & Sauces'
  if (/cumin|coriander|turmeric|paprika|chilli|masala|braai spice|herb|thyme|rosemary|bay/.test(n)) return 'Spices & Herbs'
  return 'Other'
}

export async function createGroceryListAction(recipeIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('title, ingredients')
    .in('id', recipeIds)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Combine and deduplicate ingredients
  const itemMap = new Map<string, GroceryItem>()
  for (const recipe of recipes ?? []) {
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim()
      if (itemMap.has(key)) {
        // Simple amount concatenation — future improvement: parse & sum numerics
        const existing = itemMap.get(key)!
        existing.amount = existing.amount ? `${existing.amount} + ${ing.amount}` : ing.amount
      } else {
        itemMap.set(key, {
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: categorise(ing.name),
          checked: false,
        })
      }
    }
  }

  const items = Array.from(itemMap.values()).sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  )

  const listData: GroceryListInsert = {
    name: `Grocery List — ${new Date().toLocaleDateString('en-ZA')}`,
    items,
    recipe_ids: recipeIds,
  }

  const { data: list, error: insertError } = await supabase
    .from('grocery_lists')
    .insert({ ...listData, user_id: user.id })
    .select()
    .single()

  if (insertError) return { error: insertError.message }

  revalidatePath('/grocery-list')
  return { id: list.id }
}

export async function updateGroceryItemAction(listId: string, items: GroceryItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('grocery_lists')
    .update({ items })
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/grocery-list')
  return { success: true }
}

export async function deleteGroceryListAction(listId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('grocery_lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/grocery-list')
  return { success: true }
}
