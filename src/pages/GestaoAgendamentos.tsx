import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar as CalendarIcon,
  MessageCircle,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getOrCreateConversa } from '@/services/chat'
import {
  getAgendamentosPorMonitor,
  updateAgendamento,
  type Agendamento,
} from '@/services/agendamentos'
import { getAvaliacoesByUser } from '@/services/avaliacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AvaliacaoDialog } from '@/components/AvaliacaoDialog'

export default function GestaoAgendamentos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [isAvaliarOpen, setIsAvaliarOpen] = useState(false)

  const loadAgendamentos = async () => {
    if (!user?.id) return
    try {
      const [data, avaliacoesData] = await Promise.all([
        getAgendamentosPorMonitor(user.id),
        getAvaliacoesByUser(user.id)
      ])
      setAgendamentos(data)
      setAvaliacoes(avaliacoesData)
    } catch (error) {
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgendamentos()
  }, [user?.id])

  useRealtime(
    'agendamentos',
    () => {
      loadAgendamentos()
    },
    !!user?.id,
  )
  useRealtime(
    'avaliacoes',
    () => {
      loadAgendamentos()
    },
    !!user?.id,
  )

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

  const handleStatusChange = async (id: string, status: 'confirmado' | 'cancelado' | 'concluido') => {
    try {
      await updateAgendamento(id, { status })
      toast.success(`Agendamento ${status} com sucesso!`)
      // Optimistic update
      setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    } catch (error) {
      toast.error('Erro ao atualizar o status do agendamento')
    }
  }

  if (user && user.user_type !== 'monitor' && user.user_type !== 'professor') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 animate-in fade-in slide-in-from-bottom-4">
        <XCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Acesso Negado</h2>
        <p className="mt-2 text-center">Apenas monitores e professores têm acesso a esta página.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Agendamentos</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestão de Agendamentos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os pedidos de tutoria dos estudantes
          </p>
        </div>
      </div>

      {agendamentos.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center h-64 text-slate-500">
            <CalendarIcon className="h-12 w-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">Nenhum agendamento encontrado</p>
            <p className="text-sm">Você não possui solicitações de agendamento no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
          {agendamentos.map((agendamento) => (
            <Card
              key={agendamento.id}
              className="overflow-hidden shadow-sm hover:shadow transition-shadow"
            >
              <div
                className={`h-1 w-full ${
                  agendamento.status === 'pendente'
                    ? 'bg-amber-400'
                    : agendamento.status === 'confirmado'
                      ? 'bg-green-500'
                      : agendamento.status === 'concluido'
                        ? 'bg-blue-500'
                        : 'bg-red-500'
                }`}
              />              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      {agendamento.assunto}
                    </CardTitle>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-2 font-medium">
                      <User className="h-4 w-4" />
                      {agendamento.expand?.estudante_id?.name || 'Estudante anônimo'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-2.5 text-sm text-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    className={
                      agendamento.status === 'concluido' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 border' : ''
                    }
                    variant={
                      agendamento.status === 'pendente'
                        ? 'secondary'
                        : agendamento.status === 'confirmado'
                          ? 'default'
                          : agendamento.status === 'concluido'
                            ? 'outline'
                            : 'destructive'
                    }
                  >                    {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  {format(parseISO(agendamento.data_agendamento), 'dd/MM/yyyy')}
                </div>
                {(agendamento.horario_inicio || agendamento.horario_fim) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {agendamento.horario_inicio}{' '}
                    {agendamento.horario_fim ? `às ${agendamento.horario_fim}` : ''}
                  </div>
                )}
                {agendamento.local && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {agendamento.local}
                  </div>
                )}
              </CardContent>
              {(agendamento.status === 'pendente' || agendamento.status === 'confirmado' || agendamento.status === 'concluido') && (
                <CardFooter className="bg-slate-50 border-t flex-col gap-2 pt-4">
                  {agendamento.status === 'pendente' && (
                    <div className="flex gap-2 w-full">
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(agendamento.id, 'confirmado')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => handleStatusChange(agendamento.id, 'cancelado')}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                  {agendamento.status === 'confirmado' && (
                    <div className="flex gap-2 w-full">
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStatusChange(agendamento.id, 'concluido')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => handleStatusChange(agendamento.id, 'cancelado')}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                  {agendamento.status === 'concluido' && !avaliacoes.some(a => a.agendamento_id === agendamento.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                      onClick={() => {
                        setSelectedAgendamento(agendamento)
                        setIsAvaliarOpen(true)
                      }}
                    >
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      Avaliar Estudante
                    </Button>
                  )}
                  {agendamento.status === 'concluido' && avaliacoes.some(a => a.agendamento_id === agendamento.id) && (
                    <div className="w-full text-center text-sm text-slate-500 flex items-center justify-center gap-1 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Estudante Avaliado
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={() => handleOpenChat(agendamento)}
                  >
                    <MessageCircle className="h-4 w-4" /> Mensagem
                  </Button>
                </CardFooter>
              )}            </Card>
          ))}
        </div>
      )}
    </div>

      <AvaliacaoDialog 
        open={isAvaliarOpen} 
        onOpenChange={setIsAvaliarOpen} 
        agendamento={selectedAgendamento} 
        currentUser={user}
        onSuccess={loadAgendamentos}
      />
    </div>
  )
}
