import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  XCircle,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar as CalendarIcon,
  Edit2,
  Plus,
  Building,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getOrCreateConversa } from '@/services/chat'
import { getLocaisPorLider, createLocal } from '@/services/locais'
import {
  getAgendamentosPorLider,
  updateAgendamento,
  type Agendamento,
} from '@/services/agendamentos'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const localSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  endereco: z.string().optional(),
})

const editAgendamentoSchema = z.object({
  data_agendamento: z.string().min(10, 'Data inválida'),
  horario_inicio: z.string().min(1, 'Horário de início é obrigatório'),
  horario_fim: z.string().min(1, 'Horário de término é obrigatório'),
})

export default function GestaoLider() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [locais, setLocais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null)

  const localForm = useForm<z.infer<typeof localSchema>>({
    resolver: zodResolver(localSchema),
    defaultValues: { nome: '', endereco: '' },
  })

  const editForm = useForm<z.infer<typeof editAgendamentoSchema>>({
    resolver: zodResolver(editAgendamentoSchema),
    defaultValues: { data_agendamento: '', horario_inicio: '', horario_fim: '' },
  })

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [ags, locs] = await Promise.all([
        getAgendamentosPorLider(user.id),
        getLocaisPorLider(user.id),
      ])
      setAgendamentos(ags)
      setLocais(locs)
    } catch (error) {
      toast.error('Erro ao carregar dados da gestão')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime(
    'agendamentos',
    () => {
      loadData()
    },
    !!user?.id,
  )
  useRealtime(
    'locais',
    () => {
      loadData()
    },
    !!user?.id,
  )

  const onLocalSubmit = async (values: z.infer<typeof localSchema>) => {
    if (!user?.id) return
    try {
      await createLocal({ ...values, lider_id: user.id })
      toast.success('Local criado com sucesso!')
      localForm.reset()
      setDialogOpen(false)
      loadData()
    } catch (err) {
      toast.error('Erro ao criar local')
    }
  }

  const handleCancelAgendamento = async (id: string) => {
    try {
      await updateAgendamento(id, { status: 'cancelado' })
      toast.success('Agendamento cancelado com sucesso!')
      setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelado' } : a)))
    } catch (err) {
      toast.error('Erro ao cancelar agendamento')
    }
  }

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

  const openEditAgendamento = (a: Agendamento) => {
    setEditingAgendamento(a)
    editForm.reset({
      data_agendamento: a.data_agendamento.substring(0, 10),
      horario_inicio: a.horario_inicio || '',
      horario_fim: a.horario_fim || '',
    })
    setEditDialogOpen(true)
  }

  const onEditSubmit = async (values: z.infer<typeof editAgendamentoSchema>) => {
    if (!editingAgendamento) return
    try {
      const dataToUpdate = {
        data_agendamento: new Date(values.data_agendamento).toISOString(),
        horario_inicio: values.horario_inicio,
        horario_fim: values.horario_fim,
      }
      await updateAgendamento(editingAgendamento.id, dataToUpdate)
      toast.success('Agendamento atualizado com sucesso!')
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      toast.error('Erro ao atualizar agendamento')
    }
  }

  if (user && user.user_type !== 'lider_escolar') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 animate-in fade-in slide-in-from-bottom-4">
        <XCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Acesso Negado</h2>
        <p className="mt-2 text-center">Apenas líderes escolares têm acesso a esta página.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 w-full">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Minha Gestão</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Minha Gestão</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os locais de estudo e monitore os agendamentos
          </p>
        </div>
      </div>

      <Tabs defaultValue="agendamentos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="agendamentos" className="gap-2">
            <CalendarIcon className="h-4 w-4" /> Agenda Consolidada
          </TabsTrigger>
          <TabsTrigger value="locais" className="gap-2">
            <Building className="h-4 w-4" /> Meus Locais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendamentos" className="space-y-4">
          {agendamentos.length === 0 ? (
            <Card className="border-dashed shadow-sm">
              <CardContent className="flex flex-col items-center justify-center h-64 text-slate-500">
                <CalendarIcon className="h-12 w-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-700">Nenhum agendamento encontrado</p>
                <p className="text-sm">
                  Os locais que você gerencia não possuem agendamentos ainda.
                </p>
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
                    className={`h-1 w-full ${agendamento.status === 'pendente' ? 'bg-amber-400' : agendamento.status === 'confirmado' ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          {agendamento.assunto}
                        </CardTitle>
                        <div className="text-sm text-slate-500 flex flex-col gap-1 mt-2 font-medium">
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Est:{' '}
                            {agendamento.expand?.estudante_id?.name || 'Anônimo'}
                          </span>
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Mon:{' '}
                            {agendamento.expand?.monitor_id?.name || 'Anônimo'}
                          </span>
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
                    {agendamento.expand?.local_id?.nome && (
                      <div className="flex items-center gap-2 text-indigo-600 font-medium">
                        <MapPin className="h-4 w-4" />
                        {agendamento.expand.local_id.nome}
                      </div>
                    )}
                  </CardContent>
                  {(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && (
                    <CardFooter className="bg-slate-50 border-t gap-2 pt-4 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => openEditAgendamento(agendamento)}
                      >
                        <Edit2 className="h-4 w-4" /> Remarcar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={() => handleCancelAgendamento(agendamento.id)}
                      >
                        <XCircle className="h-4 w-4" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full gap-2 mt-2"
                        onClick={() => handleOpenChat(agendamento)}
                      >
                        <MessageCircle className="h-4 w-4" /> Mensagem
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locais" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Novo Local
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Local</DialogTitle>
                </DialogHeader>
                <Form {...localForm}>
                  <form onSubmit={localForm.handleSubmit(onLocalSubmit)} className="space-y-4">
                    <FormField
                      control={localForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Local</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Biblioteca Central" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={localForm.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Endereço opcional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Salvar Local
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {locais.length === 0 ? (
            <Card className="border-dashed shadow-sm">
              <CardContent className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Building className="h-12 w-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-700">Nenhum local cadastrado</p>
                <p className="text-sm">
                  Cadastre locais para que os estudantes possam agendar neles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locais.map((local) => (
                <Card key={local.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-indigo-500" />
                      {local.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">
                      {local.endereco || 'Sem endereço especificado'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarcar Agendamento</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="data_agendamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="horario_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="horario_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
