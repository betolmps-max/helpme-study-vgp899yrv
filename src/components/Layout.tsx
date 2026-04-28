import { Outlet, useLocation, Link } from 'react-router-dom'
import {
  Shield,
  LogOut,
  Calendar,
  ClipboardList,
  Menu,
  Search,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { TermosOverlay } from '@/components/TermosOverlay'
import logoImg from '@/assets/adapta-image-1776703638057-8b530.png'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import pb from '@/lib/pocketbase/client'

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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
              {user.user_type === 'lider_escolar' && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <Link to="/gestao-lider">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Minha Gestão</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Link to="/monitores/busca">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Comunidade</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Link to="/chat">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Chat</span>
                </Link>
              </Button>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ml-2 ring-1 ring-slate-200 hover:ring-indigo-300 transition-all"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.avatar ? pb.files.getURL(user, user.avatar) : ''}
                        alt={user.name || user.email}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">
                        {user.name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="w-full cursor-pointer flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Editar Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <TermosOverlay>
            <Outlet />
          </TermosOverlay>
        </div>
      </main>
    </div>
  )
}
