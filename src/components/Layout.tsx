import { Outlet, useLocation, Link } from 'react-router-dom'
import { Shield, LogOut, Calendar, ClipboardList, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import logoImg from '@/assets/adapta-image-1776703638057-8b530.png'

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isLanding = location.pathname === '/'
  const hideHeader = isAuthPage || isLanding

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {!hideHeader && (
        <header className="sticky top-0 z-40 w-full flex flex-shrink-0 items-center justify-between px-3 py-3 sm:px-8 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
          <Link
            to="/home"
            className="flex items-center gap-2 sm:gap-3 text-slate-700 hover:opacity-80 transition-opacity min-w-0"
          >
            <img
              src={logoImg}
              alt="Help me study!"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 object-contain rounded-full shadow-sm border border-slate-100"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold tracking-tight text-[#1c1c3c] leading-none text-base sm:text-lg truncate">
                Help me study!
              </span>
              <span className="text-[9px] sm:text-xs text-slate-500 font-medium leading-none mt-1 truncate">
                Connecting students and tutors
              </span>
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Link to="/agendamentos">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Agendamentos</span>
                </Link>
              </Button>
              {(user.user_type === 'monitor' || user.user_type === 'professor') && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <Link to="/gestao-agendamentos">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Gestão</span>
                  </Link>
                </Button>
              )}
              {user.is_admin && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <Link to="/admin">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Admin</span>
                  </Link>
                </Button>
              )}
              <Link
                to="/perfil"
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors max-w-[80px] sm:max-w-[150px] md:max-w-[200px] truncate"
                title={user.name || user.email}
              >
                {user.name || user.email}
              </Link>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline-block">Logout</span>
              </Button>
            </div>
          )}
        </header>
      )}

      <main
        className={cn(
          'flex flex-1 flex-col items-center w-full',
          hideHeader ? 'justify-center p-4 sm:p-8' : 'p-4 sm:p-8',
        )}
      >
        <div
          className={cn(
            'w-full animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center',
            isAuthPage ? 'max-w-md' : isLanding ? 'max-w-full' : 'max-w-5xl',
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
