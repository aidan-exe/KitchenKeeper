import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RecipeForm } from '@/components/recipe/recipe-form'

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Edit Recipe</h1>
      <RecipeForm recipe={recipe} />
    </div>
  )
}
