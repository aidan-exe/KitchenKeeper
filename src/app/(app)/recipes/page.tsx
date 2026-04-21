import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecipeCard } from '@/components/recipe/recipe-card'
import { RecipeSearch } from '@/components/recipe/recipe-search'
import { Plus } from 'lucide-react'

interface Props {
  searchParams: Promise<{ q?: string; tag?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { q, tag } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('recipes')
    .select('id, title, description, tags, prep_time, cook_time, servings, photo_url')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)
  if (tag) query = query.contains('tags', [tag])

  const { data: recipes } = await query

  // Collect all unique tags for filter chips
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('tags')
    .eq('user_id', user!.id)

  const allTags = [...new Set((allRecipes ?? []).flatMap((r) => r.tags ?? []))].sort()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Recipes</h1>
        <Link href="/recipes/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </Link>
      </div>

      <RecipeSearch initialQ={q} initialTag={tag} allTags={allTags} />

      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="font-medium">{q || tag ? 'No recipes match that search' : 'No recipes yet'}</p>
          {!q && !tag && (
            <Link href="/recipes/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white mt-2">
                <Plus className="h-4 w-4 mr-2" /> Add your first recipe
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
