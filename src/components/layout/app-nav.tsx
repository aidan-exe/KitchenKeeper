'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, BookOpen, ShoppingCart, LayoutDashboard, Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOutAction } from '@/actions/auth'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/grocery-list', label: 'Grocery', icon: ShoppingCart },
]

export function AppNav({ user }: { user: User }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const initials = (user.user_metadata?.display_name as string ?? user.email ?? 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 w-full flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-orange-500">
            <ChefHat className="h-5 w-5" />
            KitchenKeeper
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant="ghost" size="sm" className={cn(pathname.startsWith(href) && 'bg-muted')}>
                  <Icon className="h-4 w-4 mr-1.5" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOutAction()}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              'flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors',
              pathname.startsWith(href) ? 'text-orange-500' : 'text-muted-foreground'
            )}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOutAction()}
            className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
            Out
          </button>
        </div>
      </nav>
    </>
  )
}
