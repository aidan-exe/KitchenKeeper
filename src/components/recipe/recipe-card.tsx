import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-react'

interface Props {
  recipe: {
    id: string
    title: string
    description: string | null
    tags: string[]
    prep_time: number | null
    cook_time: number | null
    servings: number
    photo_url: string | null
  }
}

export function RecipeCard({ recipe }: Props) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        {recipe.photo_url ? (
          <div className="relative h-40 w-full">
            <Image src={recipe.photo_url} alt={recipe.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        <CardContent className="pt-3 pb-4 space-y-2">
          <p className="font-semibold leading-tight line-clamp-2">{recipe.title}</p>
          {recipe.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{recipe.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {totalTime} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {recipe.servings}
            </span>
          </div>
          {recipe.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
