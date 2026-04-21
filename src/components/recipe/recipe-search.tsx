'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

interface Props {
  initialQ?: string
  initialTag?: string
  allTags: string[]
}

export function RecipeSearch({ initialQ, initialTag, allTags }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const updateSearch = useCallback((q: string, tag?: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tag) params.set('tag', tag)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [router, pathname])

  const handleSearch = useDebouncedCallback((value: string) => {
    updateSearch(value, initialTag)
  }, 300)

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search recipes..."
          defaultValue={initialQ}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {initialTag && (
            <Badge
              variant="outline"
              className="cursor-pointer gap-1"
              onClick={() => updateSearch(initialQ ?? '')}
            >
              {initialTag} <X className="h-3 w-3" />
            </Badge>
          )}
          {allTags.filter((t) => t !== initialTag).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30"
              onClick={() => updateSearch(initialQ ?? '', tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
