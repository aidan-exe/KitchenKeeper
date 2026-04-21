'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { RecipeInsert, RecipeUpdate } from '@/types'

const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string(),
  unit: z.string(),
})

const stepSchema = z.object({
  step: z.number(),
  text: z.string().min(1),
  timerMinutes: z.number().optional(),
})

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
  instructions: z.array(stepSchema).min(1, 'Add at least one step'),
  prep_time: z.number().nullable(),
  cook_time: z.number().nullable(),
  servings: z.number().min(1).default(4),
  source_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()),
  notes: z.string().optional(),
})

export async function createRecipeAction(data: RecipeInsert) {
  const parsed = recipeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/recipes')
  redirect(`/recipes/${recipe.id}`)
}

export async function updateRecipeAction(id: string, data: RecipeUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('recipes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/recipes')
  revalidatePath(`/recipes/${id}`)
  return { success: true }
}

export async function deleteRecipeAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/recipes')
  redirect('/recipes')
}

export async function uploadRecipePhotoAction(recipeId: string, formData: FormData) {
  const file = formData.get('photo') as File
  if (!file) return { error: 'No file provided' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${recipeId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('recipe-photos')
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('recipe-photos')
    .getPublicUrl(path)

  await supabase
    .from('recipes')
    .update({ photo_url: publicUrl })
    .eq('id', recipeId)
    .eq('user_id', user.id)

  revalidatePath(`/recipes/${recipeId}`)
  return { url: publicUrl }
}

// Attempt to parse recipe data from a URL (best-effort scraping via server action)
export async function importRecipeFromUrlAction(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KitchenKeeper/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

    // Extract JSON-LD recipe schema if present
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        try {
          const content = block.replace(/<[^>]+>/g, '')
          const json = JSON.parse(content)
          const recipe = Array.isArray(json) ? json.find((j: { '@type': string }) => j['@type'] === 'Recipe') : json['@type'] === 'Recipe' ? json : null
          if (recipe) {
            return {
              data: {
                title: recipe.name ?? '',
                description: recipe.description ?? '',
                ingredients: (recipe.recipeIngredient ?? []).map((i: string) => ({
                  name: i, amount: '', unit: '',
                })),
                instructions: (recipe.recipeInstructions ?? []).map((s: { text?: string } | string, idx: number) => ({
                  step: idx + 1,
                  text: typeof s === 'string' ? s : s.text ?? '',
                })),
                prep_time: recipe.prepTime ? parseDuration(recipe.prepTime) : null,
                cook_time: recipe.cookTime ? parseDuration(recipe.cookTime) : null,
                servings: parseInt(recipe.recipeYield) || 4,
                source_url: url,
                tags: [],
              },
            }
          }
        } catch { /* continue */ }
      }
    }

    // Fallback: return just the title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/)
    return {
      data: {
        title: titleMatch?.[1]?.trim() ?? '',
        description: '',
        ingredients: [],
        instructions: [],
        prep_time: null,
        cook_time: null,
        servings: 4,
        source_url: url,
        tags: [],
      },
      partial: true,
    }
  } catch {
    return { error: 'Could not fetch recipe from that URL. Try adding it manually.' }
  }
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  return (parseInt(match[1] ?? '0') * 60) + parseInt(match[2] ?? '0')
}
