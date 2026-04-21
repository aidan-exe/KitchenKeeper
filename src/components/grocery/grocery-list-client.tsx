'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateGroceryItemAction, deleteGroceryListAction } from '@/actions/grocery'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
import type { GroceryList, GroceryItem } from '@/types'

interface Props { list: GroceryList }

export function GroceryListClient({ list }: Props) {
  const [items, setItems] = useState<GroceryItem[]>(list.items)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleItem(index: number) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    )
    setItems(updated)
    startTransition(async () => {
      const result = await updateGroceryItemAction(list.id, updated)
      if (result.error) toast.error(result.error)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGroceryListAction(list.id)
      if (result.error) toast.error(result.error)
      else { toast.success('List deleted'); router.refresh() }
    })
  }

  // Group items by category
  const grouped = items.reduce<Record<string, { item: GroceryItem; index: number }[]>>((acc, item, i) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ item, index: i })
    return acc
  }, {})

  const checkedCount = items.filter((i) => i.checked).length

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{list.name}</p>
            <p className="text-xs text-muted-foreground">{checkedCount}/{items.length} items checked</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {Object.entries(grouped).map(([category, entries], ci) => (
          <div key={category}>
            {ci > 0 && <Separator className="mb-3" />}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</p>
            <ul className="space-y-2">
              {entries.map(({ item, index }) => (
                <li key={index}>
                  <button
                    onClick={() => toggleItem(index)}
                    className={`w-full flex items-center gap-3 text-left transition-opacity ${item.checked ? 'opacity-50' : ''}`}
                  >
                    <span className={`h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.checked ? 'bg-orange-500 border-orange-500' : 'border-muted-foreground'
                    }`}>
                      {item.checked && <span className="text-white text-xs">✓</span>}
                    </span>
                    <span className={`text-sm ${item.checked ? 'line-through' : ''}`}>
                      {item.amount && <span className="font-medium">{item.amount} {item.unit} </span>}
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
