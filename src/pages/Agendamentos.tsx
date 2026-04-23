import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarIcon, Clock, MapPin, User, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getOrCreateConversa } from '@/services/chat'
import { useRealtime } from '@/hooks/use-realtime'
import { getAgendamentos, Agendamento } from '@/services/agendamentos'
import { getMonitors } from '@/services/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AgendamentoForm } from '@/components/AgendamentoForm'

export default function AgendamentosPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [monitors, setMonitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [agendamentosData, monitorsData] = await Promise.all([getAgendamentos(), getMonitors()])
      setAgendamentos(agendamentosData)
      setMonitors(monitorsData)
    } catch (error) {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user])

  useRealtime('agendamentos', () => {
    loadData()
  })

  if (!user) return <Navigate to="/login" replace />

  const handleOpenChat = async (agendamento: Agendamento) => {
    if (!user?.id) return
    try {
      const participantes = [user.id]
      if (agendamento.estudante_id && agendamento.estudante_id !== user.id)
        participantes.push(agendamento.estudante_id)
      if (agendamento.monitor_id && agendamento.monitor_id !== user.id)
        participantes.push(agendamento.monitor_id)
      const uniqueParticipantes = Array.from(new Set(participantes))

      const conversa = await getOrCreateConversa(uniqueParticipantes, agendamento.id)
      navigate(`/chat?conversaId=${conversa.id}`)
    } catch (err) {
      toast.error('Erro ao iniciar chat')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas sessões de estudo e monitorias.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Novo Agendamento</CardTitle>
              <CardDescription>Agende uma monitoria com um de nossos monitores.</CardDescription>
            </CardHeader>
            <CardContent>
              <AgendamentoForm monitors={monitors} userId={user.id} onSuccess={loadData} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-32 bg-slate-100 animate-pulse rounded-lg border" />
              <div className="h-32 bg-slate-100 animate-pulse rounded-lg border" />
            </div>
          ) : agendamentos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-slate-500">
                <CalendarIcon className="h-8 w-8 mb-4 opacity-20" />
                <p>Nenhum agendamento encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            agendamentos.map((agendamento) => (
              <Card key={agendamento.id} className="transition-all hover:shadow-md">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-semibold text-lg text-slate-900 leading-none">
                        {agendamento.assunto}
                      </h4>
                      <Badge variant="outline" className={getStatusColor(agendamento.status)}>
                        {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 mt-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span
                          className="truncate"
                          title={agendamento.expand?.monitor_id?.name || 'Monitor'}
                        >
                          {agendamento.expand?.monitor_id?.name ||
                            agendamento.expand?.monitor_id?.email ||
                            'Monitor'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span>{format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span>
                          {agendamento.horario_inicio} às {agendamento.horario_fim}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="truncate" title={agendamento.local}>
                          {agendamento.local}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:justify-end sm:border-l sm:pl-4 mt-4 sm:mt-0 gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleOpenChat(agendamento)}
                    >
                      <MessageCircle className="h-4 w-4" /> Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
