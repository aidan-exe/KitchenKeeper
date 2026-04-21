import { createClient } from '@/lib/supabase/server'
import { GroceryListClient } from '@/components/grocery/grocery-list-client'
import { RecipePicker } from '@/components/grocery/recipe-picker'

export default async function GroceryListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: lists }, { data: recipes }] = await Promise.all([
    supabase.from('grocery_lists').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('recipes').select('id, title').eq('user_id', user!.id).order('title'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grocery List</h1>
      <RecipePicker recipes={recipes ?? []} />
      {lists && lists.length > 0 ? (
        <div className="space-y-4">
          {lists.map((list) => (
            <GroceryListClient key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-3xl">🛒</p>
          <p className="font-medium">No grocery lists yet</p>
          <p className="text-sm text-muted-foreground">Select recipes above to generate a list.</p>
        </div>
      )}
    </div>
  )
}
