'use client'

import { useTransition, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createRecipeAction, updateRecipeAction, importRecipeFromUrlAction } from '@/actions/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Loader2, Link as LinkIcon } from 'lucide-react'
import type { Recipe } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    amount: z.string(),
    unit: z.string(),
  })).min(1, 'Add at least one ingredient'),
  instructions: z.array(z.object({
    step: z.number(),
    text: z.string().min(1, 'Step text required'),
    timerMinutes: z.number().optional(),
  })).min(1, 'Add at least one step'),
  prep_time: z.number().nullable(),
  cook_time: z.number().nullable(),
  servings: z.number().min(1),
  source_url: z.string().optional(),
  tags: z.string(), // comma-separated input
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props { recipe?: Recipe }

export function RecipeForm({ recipe }: Props) {
  const [isPending, startTransition] = useTransition()
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: recipe ? {
      ...recipe,
      tags: recipe.tags?.join(', ') ?? '',
      prep_time: recipe.prep_time ?? null,
      cook_time: recipe.cook_time ?? null,
    } : {
      ingredients: [{ name: '', amount: '', unit: '' }],
      instructions: [{ step: 1, text: '' }],
      servings: 4,
      prep_time: null,
      cook_time: null,
      tags: '',
    },
  })

  const { fields: ingFields, append: addIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' })
  const { fields: stepFields, append: addStep, remove: removeStep } = useFieldArray({ control, name: 'instructions' })

  async function handleImport() {
    if (!importUrl) return
    setImporting(true)
    const result = await importRecipeFromUrlAction(importUrl)
    setImporting(false)
    if (result.error) { toast.error(result.error); return }
    if (result.data) {
      reset({
        ...result.data,
        tags: result.data.tags?.join(', ') ?? '',
        prep_time: result.data.prep_time ?? null,
        cook_time: result.data.cook_time ?? null,
        description: result.data.description ?? '',
        notes: '',
      })
      if (result.partial) toast.info('Partial import — please fill in the missing details.')
      else toast.success('Recipe imported! Review and save.')
    }
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        instructions: data.instructions.map((s, i) => ({ ...s, step: i + 1 })),
        description: data.description ?? null,
        notes: data.notes ?? null,
        source_url: data.source_url ?? null,
        photo_url: recipe?.photo_url ?? null,
      }

      if (recipe) {
        const result = await updateRecipeAction(recipe.id, payload)
        if (result?.error) toast.error(result.error)
        else toast.success('Recipe updated')
      } else {
        const result = await createRecipeAction(payload)
        if (result?.error) toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* URL Import */}
      {!recipe && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2">
            <Label>Import from URL (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Works best with sites that use recipe schema markup.</p>
          </CardContent>
        </Card>
      )}

      {/* Basic info */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="Braai Chicken, Bobotie..." {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="A short description..." rows={2} {...register('description')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="prep_time">Prep (min)</Label>
            <Input id="prep_time" type="number" min={0} {...register('prep_time', { valueAsNumber: true, setValueAs: v => v === '' ? null : Number(v) })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cook_time">Cook (min)</Label>
            <Input id="cook_time" type="number" min={0} {...register('cook_time', { valueAsNumber: true, setValueAs: v => v === '' ? null : Number(v) })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="servings">Servings</Label>
            <Input id="servings" type="number" min={1} {...register('servings', { valueAsNumber: true })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" placeholder="braai, quick, vegetarian..." {...register('tags')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="source_url">Source URL</Label>
          <Input id="source_url" placeholder="https://..." {...register('source_url')} />
        </div>
      </div>

      <Separator />

      {/* Ingredients */}
      <div className="space-y-3">
        <h2 className="font-semibold">Ingredients</h2>
        {errors.ingredients && <p className="text-xs text-destructive">{errors.ingredients.message}</p>}
        {ingFields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-start">
            <Input className="w-20 flex-shrink-0" placeholder="Amount" {...register(`ingredients.${i}.amount`)} />
            <Input className="w-20 flex-shrink-0" placeholder="Unit" {...register(`ingredients.${i}.unit`)} />
            <Input className="flex-1" placeholder="Ingredient name" {...register(`ingredients.${i}.name`)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeIng(i)} disabled={ingFields.length === 1}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addIng({ name: '', amount: '', unit: '' })}>
          <Plus className="h-4 w-4 mr-1" /> Add ingredient
        </Button>
      </div>

      <Separator />

      {/* Instructions */}
      <div className="space-y-3">
        <h2 className="font-semibold">Instructions</h2>
        {errors.instructions && <p className="text-xs text-destructive">{errors.instructions.message}</p>}
        {stepFields.map((field, i) => (
          <div key={field.id} className="flex gap-3 items-start">
            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center mt-1">
              {i + 1}
            </span>
            <Textarea
              className="flex-1"
              placeholder={`Step ${i + 1}...`}
              rows={2}
              {...register(`instructions.${i}.text`)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(i)} disabled={stepFields.length === 1}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addStep({ step: stepFields.length + 1, text: '' })}>
          <Plus className="h-4 w-4 mr-1" /> Add step
        </Button>
      </div>

      <Separator />

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Tips, substitutions, serving suggestions..." rows={3} {...register('notes')} />
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : recipe ? 'Save changes' : 'Save recipe'}
      </Button>
    </form>
  )
}
