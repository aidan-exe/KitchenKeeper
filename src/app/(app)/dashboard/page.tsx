import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, ShoppingCart, Plus, Flame } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: recipeCount }, { data: recentRecipes }] = await Promise.all([
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('recipes').select('id, title, tags, cook_time').eq('user_id', user!.id)
      .order('created_at', { ascending: false }).limit(4),
  ])

  const name = (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0] ?? 'Chef'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Howzit, {name} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">What are we cooking today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recipeCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Recipes saved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
              <Flame className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">🔥</p>
              <p className="text-xs text-muted-foreground">Braai season</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/recipes/new" className="flex-1">
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Recipe
          </Button>
        </Link>
        <Link href="/grocery-list" className="flex-1">
          <Button variant="outline" className="w-full">
            <ShoppingCart className="h-4 w-4 mr-2" /> Grocery List
          </Button>
        </Link>
      </div>

      {/* Recent recipes */}
      {recentRecipes && recentRecipes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent recipes</h2>
            <Link href="/recipes" className="text-sm text-orange-500 hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentRecipes.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <p className="font-medium truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {r.cook_time && (
                        <span className="text-xs text-muted-foreground">{r.cook_time} min</span>
                      )}
                      {r.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recipeCount === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">🍳</p>
          <p className="font-medium">No recipes yet</p>
          <p className="text-sm text-muted-foreground">Add your first recipe — braai, bunny chow, whatever you love.</p>
          <Link href="/recipes/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add your first recipe
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
