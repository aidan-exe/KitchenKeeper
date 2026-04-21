'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createGroceryListAction } from '@/actions/grocery'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Loader2 } from 'lucide-react'

interface Props {
  recipes: { id: string; title: string }[]
}

export function RecipePicker({ recipes }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleGenerate() {
    if (selected.size === 0) { toast.error('Select at least one recipe'); return }
    startTransition(async () => {
      const result = await createGroceryListAction(Array.from(selected))
      if (result.error) toast.error(result.error)
      else {
        toast.success('Grocery list created')
        setSelected(new Set())
        router.refresh()
      }
    })
  }

  if (recipes.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Select recipes to generate a list:</p>
      <div className="flex flex-wrap gap-2">
        {recipes.map((r) => (
          <button
            key={r.id}
            onClick={() => toggle(r.id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selected.has(r.id)
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-border hover:border-orange-300'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>
      {selected.size > 0 && (
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleGenerate} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
          Generate list ({selected.size} recipe{selected.size > 1 ? 's' : ''})
        </Button>
      )}
    </div>
  )
}
