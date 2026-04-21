import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CookingMode } from '@/components/cooking/cooking-mode'

interface Props { params: Promise<{ id: string }> }

export default async function CookingPage({ params }: Props) {
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

  return <CookingMode recipe={recipe} />
}
