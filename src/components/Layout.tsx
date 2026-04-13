import { Outlet, useLocation, Link } from 'react-router-dom'
import { School, Shield, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 pt-20 p-4 font-sans sm:p-8">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4 sm:px-8 border-b bg-white/80 backdrop-blur-md z-10">
        <Link
          to="/home"
          className="flex items-center gap-2 text-slate-700 hover:opacity-80 transition-opacity"
        >
          <School className="h-6 w-6 text-indigo-600" />
          <span className="font-bold tracking-tight hidden sm:inline-block">Helpme Study!</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            {user.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Link to="/admin">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Admin Dashboard</span>
                </Link>
              </Button>
            )}
            <div className="text-sm font-medium text-slate-600 hidden md:block">{user.email}</div>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Logout</span>
            </Button>
          </div>
        )}
      </header>

      <div
        className={cn(
          'w-full animate-in fade-in zoom-in-95 duration-500',
          isAuthPage ? 'max-w-md' : 'max-w-5xl',
        )}
      >
        <Outlet />
      </div>
    </main>
  )
}
