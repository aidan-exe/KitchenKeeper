import { RecipeForm } from '@/components/recipe/recipe-form'

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Add Recipe</h1>
      <RecipeForm />
    </div>
  )
}
