import { SignupForm } from '@/components/auth/signup-form'
import { ChefHat } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-orange-500 text-white p-3 rounded-2xl">
              <ChefHat className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join KitchenKeeper</h1>
          <p className="text-muted-foreground">Start saving your favourite recipes today.</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
