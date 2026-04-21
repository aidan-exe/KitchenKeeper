'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, X, Plus, Minus, Timer, TimerOff } from 'lucide-react'
import type { Recipe, Ingredient } from '@/types'

interface Props { recipe: Recipe }

export function CookingMode({ recipe }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [servings, setServings] = useState(recipe.servings)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)

  const step = recipe.instructions[currentStep]
  const progress = ((currentStep + 1) / recipe.instructions.length) * 100
  const scale = servings / recipe.servings

  // Timer countdown
  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return
    if (timerSeconds <= 0) { setTimerRunning(false); return }
    const id = setInterval(() => setTimerSeconds((s) => (s ?? 1) - 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning, timerSeconds])

  const startTimer = useCallback((minutes: number) => {
    setTimerSeconds(minutes * 60)
    setTimerRunning(true)
  }, [])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function scaleAmount(amount: string): string {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    const scaled = num * scale
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1)
  }

  function toggleIngredient(i: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <Link href={`/recipes/${recipe.id}`}>
          <Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
        </Link>
        <div className="text-center">
          <p className="font-semibold text-sm truncate max-w-[200px]">{recipe.title}</p>
          <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {recipe.instructions.length}</p>
        </div>
        <div className="w-10" />
      </div>

      <Progress value={progress} className="h-1 rounded-none" />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Servings scaler */}
        <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
          <span className="text-sm font-medium">Servings</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setServings(Math.max(1, servings - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="font-bold text-lg w-6 text-center">{servings}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setServings(servings + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Ingredients checklist */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ingredients</h3>
          {recipe.ingredients.map((ing: Ingredient, i: number) => (
            <button
              key={i}
              onClick={() => toggleIngredient(i)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                checkedIngredients.has(i) ? 'bg-muted opacity-50 line-through' : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <span className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                checkedIngredients.has(i) ? 'bg-orange-500 border-orange-500' : 'border-muted-foreground'
              }`}>
                {checkedIngredients.has(i) && <span className="text-white text-xs">✓</span>}
              </span>
              <span className="text-sm">
                <span className="font-medium">{scaleAmount(ing.amount)} {ing.unit}</span> {ing.name}
              </span>
            </button>
          ))}
        </div>

        <Separator />

        {/* Current step */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
              {step.step}
            </span>
            <h3 className="font-semibold">Step {step.step}</h3>
          </div>
          <p className="text-lg leading-relaxed">{step.text}</p>

          {/* Timer */}
          {step.timerMinutes && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 space-y-2">
              {timerSeconds !== null ? (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-orange-600">
                    {formatTime(timerSeconds)}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setTimerRunning(!timerRunning)}>
                      {timerRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setTimerSeconds(null); setTimerRunning(false) }}>
                      <TimerOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => startTimer(step.timerMinutes!)}>
                  <Timer className="h-4 w-4 mr-2" /> Start {step.timerMinutes} min timer
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step navigation */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-4 flex gap-3 max-w-lg mx-auto w-full">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {currentStep < recipe.instructions.length - 1 ? (
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Link href={`/recipes/${recipe.id}`} className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Done! 🎉
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
