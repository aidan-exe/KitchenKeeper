import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RecipeActions } from '@/components/recipe/recipe-actions'
import { Clock, Users, ExternalLink, ChefHat } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!recipe) notFound()

  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Photo */}
      {recipe.photo_url ? (
        <div className="relative h-56 sm:h-72 w-full rounded-xl overflow-hidden">
          <Image src={recipe.photo_url} alt={recipe.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 672px" priority />
        </div>
      ) : (
        <div className="h-40 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 flex items-center justify-center text-5xl">
          🍽️
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{recipe.title}</h1>
          <RecipeActions recipeId={recipe.id} />
        </div>

        {recipe.description && <p className="text-muted-foreground">{recipe.description}</p>}

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {recipe.prep_time && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" /> Prep: {recipe.prep_time} min
            </span>
          )}
          {recipe.cook_time && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" /> Cook: {recipe.cook_time} min
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-orange-500" /> Total: {totalTime} min
            </span>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" /> {recipe.servings} servings
          </span>
        </div>

        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/cooking/${recipe.id}`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <ChefHat className="h-4 w-4 mr-2" /> Cook Mode
            </Button>
          </Link>
          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Ingredients */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing: { name: string; amount: string; unit: string }, i: number) => (
            <li key={i} className="flex items-center gap-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span className="font-medium text-sm">{ing.amount} {ing.unit}</span>
              <span className="text-sm">{ing.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      {/* Instructions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Instructions</h2>
        <ol className="space-y-4">
          {recipe.instructions.map((step: { step: number; text: string }) => (
            <li key={step.step} className="flex gap-4">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center">
                {step.step}
              </span>
              <p className="text-sm leading-relaxed pt-0.5">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {recipe.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.notes}</p>
          </div>
        </>
      )}
    </div>
  )
}
