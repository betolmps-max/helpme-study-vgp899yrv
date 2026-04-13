import { Outlet, useLocation } from 'react-router-dom'
import { School } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans sm:p-8">
      <div className="absolute left-4 top-4 flex items-center gap-2 text-slate-700 sm:left-8 sm:top-8">
        <School className="h-6 w-6 text-indigo-600" />
        <span className="font-bold tracking-tight">Helpme Study!</span>
      </div>
      <div
        className={cn(
          'w-full animate-in fade-in zoom-in-95 duration-500',
          isAuthPage ? 'max-w-md' : 'max-w-4xl',
        )}
      >
        <Outlet />
      </div>
    </main>
  )
}
