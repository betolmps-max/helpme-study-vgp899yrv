import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  LogOut,
  User as UserIcon,
  Calendar,
  BookOpen,
  FileText,
  Shield,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { UserLocationsList } from '@/components/locations/UserLocationsList'
import { ResponsibleDashboard } from '@/components/vinculos/ResponsibleDashboard'
import { StudentPendingLinks } from '@/components/vinculos/StudentPendingLinks'
import { WeeklySchedule } from '@/components/dashboard/WeeklySchedule'

function ExpandableText({ text, emptyMessage }: { text?: string; emptyMessage: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) {
    return <p className="text-slate-400 italic">{emptyMessage}</p>
  }

  return (
    <div
      className="group relative cursor-pointer select-none rounded-md transition-colors hover:bg-slate-100/50 p-1 -m-1"
      onDoubleClick={() => setIsExpanded(!isExpanded)}
      title="Dê um duplo clique para expandir/recolher"
    >
      <p
        className={cn(
          'text-sm text-slate-700 transition-all duration-300 break-words',
          !isExpanded && 'line-clamp-3',
        )}
      >
        {text}
      </p>
      {!isExpanded && text.length > 100 && (
        <p className="text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Duplo clique para expandir
        </p>
      )}
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  professor: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  monitor: 'bg-green-100 text-green-800 ring-green-600/20',
  student: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  responsavel: 'bg-purple-100 text-purple-800 ring-purple-600/20',
}

const TYPE_LABELS: Record<string, string> = {
  professor: 'Professor',
  monitor: 'Monitor',
  student: 'Estudante',
  responsavel: 'Responsável',
}

export default function Index() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      pb.collection('profiles')
        .getFirstListItem(`user_id="${user.id}"`)
        .then(setProfile)
        .catch((err) => {
          console.error(err)
          toast({ variant: 'destructive', description: 'Erro ao carregar perfil.' })
        })
        .finally(() => setIsLoadingProfile(false))
    }
  }, [user, toast])

  if (loading || isLoadingProfile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) return null

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const userTypeColor =
    TYPE_COLORS[user.user_type] || 'bg-slate-100 text-slate-800 ring-slate-600/20'
  const userTypeLabel = TYPE_LABELS[user.user_type] || user.user_type

  return (
    <div className="space-y-6">
      <div className="flex w-full justify-center py-4 md:py-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 drop-shadow-sm text-center">
          Help me Study!
        </h1>
      </div>
      <WeeklySchedule />
      <StudentPendingLinks userId={user.id} />
      {user.user_type === 'responsavel' && <ResponsibleDashboard userId={user.id} />}

      <Card className="w-full mx-auto shadow-elevation border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Meu Perfil
            </CardTitle>
            <CardDescription className="text-slate-500">
              Acesse e gerencie suas informações pessoais.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {user.is_admin && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/admin')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Painel Admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4 md:w-1/3 md:border-r md:border-slate-100 md:pr-8">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white shadow-sm">
                <UserIcon className="h-12 w-12 text-slate-400" />
              </div>
              <div className="text-center overflow-hidden max-w-full">
                <h3 className="text-xl font-bold text-slate-900 truncate" title={user.name}>
                  {user.name}
                </h3>
                <p className="text-sm text-slate-500 mb-3 truncate" title={user.email}>
                  {user.email}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
                    userTypeColor,
                  )}
                >
                  {userTypeLabel}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 col-span-2 overflow-hidden">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-semibold">Biografia</h4>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 overflow-hidden">
                    <ExpandableText
                      text={profile?.bio}
                      emptyMessage="Nenhuma biografia informada."
                    />
                  </div>
                </div>

                <div className="space-y-2 overflow-hidden">
                  <div className="flex items-center gap-2 text-slate-700">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-semibold">Disciplinas</h4>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 overflow-hidden">
                    <ExpandableText text={profile?.subjects} emptyMessage="Não informadas." />
                  </div>
                </div>

                <div className="space-y-2 overflow-hidden">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-semibold">Disponibilidade</h4>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 overflow-hidden">
                    <ExpandableText text={profile?.availability} emptyMessage="Não informada." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserLocationsList />
    </div>
  )
}
