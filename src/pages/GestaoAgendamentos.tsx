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
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import {
  getAgendamentosPorMonitor,
  updateAgendamento,
  type Agendamento,
} from '@/services/agendamentos'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function GestaoAgendamentos() {
  const { user } = useAuth()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)

  const loadAgendamentos = async () => {
    if (!user?.id) return
    try {
      const data = await getAgendamentosPorMonitor(user.id)
      setAgendamentos(data)
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

  const handleStatusChange = async (id: string, status: 'confirmado' | 'cancelado') => {
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
                      : 'bg-red-500'
                }`}
              />
              <CardHeader className="pb-3">
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
                    variant={
                      agendamento.status === 'pendente'
                        ? 'secondary'
                        : agendamento.status === 'confirmado'
                          ? 'default'
                          : 'destructive'
                    }
                  >
                    {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
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
              {(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && (
                <CardFooter className="bg-slate-50 border-t gap-2 pt-4">
                  {agendamento.status === 'pendente' && (
                    <Button
                      size="sm"
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange(agendamento.id, 'confirmado')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => handleStatusChange(agendamento.id, 'cancelado')}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
