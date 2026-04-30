import { useState, useMemo, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock, BookOpen, Star, ArrowLeft, User } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { createAgendamento } from '@/services/agendamentos'
import pb from '@/lib/pocketbase/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function parseAvailabilitySlots(text: string) {
  const active = new Set<string>()
  if (!text) return active

  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      for (const [key, val] of Object.entries(parsed)) {
        const dayIdx = DAYS.findIndex((d) =>
          d.toLowerCase().replace('á', 'a').startsWith(key.toLowerCase().substring(0, 3)),
        )
        if (dayIdx !== -1) {
          const times = Array.isArray(val) ? val : [val]
          times.forEach((t) => {
            const m = String(t).match(/(\d{1,2}).*?-.*?(\d{1,2})/)
            if (m) {
              const start = parseInt(m[1])
              const end = parseInt(m[2])
              for (let h = start; h < end; h++) active.add(`${dayIdx}-${h}`)
            }
          })
        }
      }
      if (active.size > 0) return active
    }
  } catch (e) {
    // ignore non-json
  }

  const regex =
    /(dom|seg|ter|qua|qui|sex|s[aá]b)[a-z-]*\s*(?:feira)?\s*[:-]?\s*(?:das|de)?\s*(\d{1,2})(?::\d{2})?h?\s*(?:a|-|às|ate|até)\s*(\d{1,2})(?::\d{2})?h?/gi
  let match
  while ((match = regex.exec(text)) !== null) {
    const dayStr = match[1].toLowerCase().replace('á', 'a')
    const dayIdx = DAYS.findIndex((d) => d.toLowerCase().replace('á', 'a').startsWith(dayStr))
    if (dayIdx !== -1) {
      const start = parseInt(match[2], 10)
      const end = parseInt(match[3], 10)
      if (!isNaN(start) && !isNaN(end) && start < end) {
        for (let h = start; h < end; h++) active.add(`${dayIdx}-${h}`)
      }
    }
  }

  if (active.size === 0) {
    const fallbackRegex =
      /(?:todos os dias|diariamente)\s*(?:das|de)?\s*(\d{1,2})(?::\d{2})?h?\s*(?:a|-|às|ate|até)\s*(\d{1,2})(?::\d{2})?h?/gi
    const matchFallback = fallbackRegex.exec(text)
    if (matchFallback) {
      const start = parseInt(matchFallback[1], 10)
      const end = parseInt(matchFallback[2], 10)
      if (!isNaN(start) && !isNaN(end) && start < end) {
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          for (let h = start; h < end; h++) active.add(`${dayIdx}-${h}`)
        }
      }
    }
  }

  return active
}

const bookingSchema = z.object({
  assunto: z.string().min(1, 'Obrigatório'),
  data_agendamento: z.date({ required_error: 'Obrigatório' }),
  horario_inicio: z.string().min(1, 'Obrigatório'),
  horario_fim: z.string().min(1, 'Obrigatório'),
  local: z.string().min(1, 'Obrigatório'),
})

export function MentorCard({ profile, user, disciplinas, locais, onBooked }: any) {
  const [open, setOpen] = useState(false)
  const [bookingSlot, setBookingSlot] = useState<{
    dayIdx: number
    hour: number
    date: Date
  } | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { assunto: '', horario_inicio: '', horario_fim: '', local: '' },
  })

  // Reset booking slot when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setBookingSlot(null), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const mentorUser = profile.expand?.user_id
  const name = mentorUser?.name || 'Usuário Sem Nome'
  const subjects = profile.subjects ? profile.subjects.split(',').map((s: string) => s.trim()) : []
  const media = mentorUser?.media_avaliacao || 0
  const totalAvaliacoes = mentorUser?.total_avaliacoes || 0
  const valorSessao = profile.valor_sessao || 0

  const activeSlots = useMemo(
    () => parseAvailabilitySlots(profile.availability),
    [profile.availability],
  )

  const slotsByDay = useMemo(() => {
    const grouped = Array.from({ length: 7 }, () => [] as number[])
    activeSlots.forEach((slot) => {
      const [d, h] = slot.split('-').map(Number)
      if (d >= 0 && d < 7) grouped[d].push(h)
    })
    return grouped.map((hours) => Array.from(new Set(hours)).sort((a, b) => a - b))
  }, [activeSlots])

  const daysWithSlots = DAYS.map((day, idx) => ({ day, idx, hours: slotsByDay[idx] })).filter(
    (d) => d.hours.length > 0,
  )

  const handleSlotClick = (dayIdx: number, hour: number) => {
    const targetJsDay = dayIdx === 6 ? 0 : dayIdx + 1
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const currentDay = d.getDay()

    let diff = targetJsDay - currentDay
    if (diff < 0) {
      diff += 7
    } else if (diff === 0 && new Date().getHours() >= hour) {
      diff += 7
    }

    d.setDate(d.getDate() + diff)

    form.setValue('data_agendamento', d)
    form.setValue('horario_inicio', `${String(hour).padStart(2, '0')}:00`)
    form.setValue('horario_fim', `${String(hour + 1).padStart(2, '0')}:00`)
    setBookingSlot({ dayIdx, hour, date: d })
  }

  const onSubmit = async (data: z.infer<typeof bookingSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Atenção',
        description: 'Você precisa estar logado para agendar.',
      })
      return
    }
    try {
      await createAgendamento({
        estudante_id: user.id,
        monitor_id: mentorUser?.id,
        assunto: data.assunto,
        data_agendamento: data.data_agendamento.toISOString(),
        horario_inicio: data.horario_inicio,
        horario_fim: data.horario_fim,
        local: data.local,
        status: 'pendente',
        valor_pago: valorSessao > 0 ? Number((valorSessao * 1.05).toFixed(2)) : 0,
      })
      setOpen(false)
      form.reset()
      onBooked()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar',
        description: error?.message || 'Ocorreu um erro inesperado. Tente novamente.',
      })
    }
  }

  const avatarUrl = mentorUser?.avatar ? pb.files.getURL(mentorUser, mentorUser.avatar) : undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="flex flex-col h-full hover:shadow-md transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-start gap-4 pb-4">
            <Avatar className="h-14 w-14 border shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between w-full gap-2">
                <CardTitle className="text-lg truncate" title={name}>
                  {name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {mentorUser?.user_type === 'professor' && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] px-1.5 py-0 h-4">
                    Professor
                  </Badge>
                )}
                {mentorUser?.user_type === 'monitor' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Monitor
                  </Badge>
                )}
                {mentorUser?.user_type === 'student' && (
                  <Badge
                    variant="outline"
                    className="border-green-600 text-green-700 text-[10px] px-1.5 py-0 h-4"
                  >
                    Estudante
                  </Badge>
                )}
              </div>
              <CardDescription className="capitalize font-medium text-primary/80 flex flex-col gap-0.5 mt-1.5">
                {(mentorUser?.user_type === 'professor' || mentorUser?.user_type === 'monitor') && (
                  <span className="flex items-center gap-1 text-xs">
                    {valorSessao > 0
                      ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number((valorSessao * 1.05).toFixed(2)))}`
                      : 'Gratuito'}
                  </span>
                )}
                {totalAvaliacoes > 0 && (
                  <span className="flex items-center text-yellow-600 text-[11px] font-semibold">
                    <Star className="h-3 w-3 fill-current mr-1" />
                    {media.toFixed(1)}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({totalAvaliacoes})
                    </span>
                  </span>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {(mentorUser?.user_type === 'monitor' || mentorUser?.user_type === 'professor') &&
              subjects.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.slice(0, 3).map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="font-normal text-xs">
                        {s}
                      </Badge>
                    ))}
                    {subjects.length > 3 && (
                      <Badge variant="secondary" className="font-normal text-xs">
                        +{subjects.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
            )}
          </CardContent>
          <div className="bg-primary/5 p-2.5 text-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto border-t border-primary/10">
            Ver perfil completo e agendar
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">
              {bookingSlot ? 'Confirmar Agendamento' : 'Perfil do Monitor'}
            </DialogTitle>
            {bookingSlot && (
              <DialogDescription>
                Preencha os detalhes abaixo para solicitar a sessão.
              </DialogDescription>
            )}
          </DialogHeader>

          {!bookingSlot ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-24 w-24 border-2 shadow-sm">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col gap-2 flex-1">
                  <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {mentorUser?.user_type === 'professor' && (
                      <Badge className="bg-blue-600 hover:bg-blue-700">Professor</Badge>
                    )}
                    {mentorUser?.user_type === 'monitor' && (
                      <Badge variant="secondary">Monitor</Badge>
                    )}
                    {mentorUser?.user_type === 'student' && (
                      <Badge variant="outline" className="border-green-600 text-green-700">
                        Estudante
                      </Badge>
                    )}
                    {totalAvaliacoes > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 px-2"
                      >
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        {media.toFixed(1)} ({totalAvaliacoes} avaliações)
                      </Badge>
                    )}
                  </div>
                  {(mentorUser?.user_type === 'professor' ||
                    mentorUser?.user_type === 'monitor') && (
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      Valor da sessão:{' '}
                      <span className="text-primary font-bold">
                        {valorSessao > 0
                          ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number((valorSessao * 1.05).toFixed(2)))}`
                          : 'Gratuito'}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" /> Sobre
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap border border-muted">
                    {profile.bio}
                  </div>
                </div>
              )}

              {(mentorUser?.user_type === 'monitor' || mentorUser?.user_type === 'professor') &&
                subjects.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" /> Disciplinas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((s: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="px-3 py-1 text-sm font-normal bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {(mentorUser?.user_type === 'monitor' || mentorUser?.user_type === 'professor') && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" /> Horários Disponíveis
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione um horário abaixo para agendar sua sessão.
                  </p>

                  {daysWithSlots.length > 0 ? (
                    <ScrollArea className="w-full pb-6">
                      <div className="flex gap-4 min-w-max">
                        {daysWithSlots.map(({ day, idx, hours }) => (
                          <div
                            key={day}
                            className="flex flex-col items-center w-28 shrink-0 bg-card rounded-xl p-3 border shadow-sm"
                          >
                            <div className="font-semibold text-sm mb-4 text-foreground">{day}</div>
                            <div className="flex flex-col gap-2.5 w-full">
                              {hours.map((h) => (
                                <Button
                                  key={h}
                                  variant="outline"
                                  size="sm"
                                  className="w-full rounded-full shadow-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all font-medium"
                                  onClick={() => handleSlotClick(idx, h)}
                                >
                                  {String(h).padStart(2, '0')}:00
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  ) : (
                    <div className="bg-muted/30 p-6 rounded-lg border text-center">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {profile.availability && profile.availability.trim() !== ''
                          ? profile.availability
                          : 'Nenhum horário estruturado informado pelo monitor.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Button
                variant="ghost"
                className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
                onClick={() => setBookingSlot(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao perfil
              </Button>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Horário Selecionado</p>
                  <p className="text-lg font-bold text-foreground">
                    {format(bookingSlot.date, 'dd/MM/yyyy')} às{' '}
                    {String(bookingSlot.hour).padStart(2, '0')}:00
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-primary/50" />
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="assunto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assunto / Disciplina</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione o assunto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((s: string, i: number) => (
                              <SelectItem key={`subj-${i}`} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                            {disciplinas
                              .filter((d: any) => !subjects.includes(d.nome))
                              .map((d: any) => (
                                <SelectItem key={`disc-${d.id}`} value={d.nome}>
                                  {d.nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Keep the date/time fields hidden or read-only since they are set by the bubble */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 hidden">
                    <FormField
                      control={form.control}
                      name="data_agendamento"
                      render={() => <FormItem />}
                    />
                    <FormField
                      control={form.control}
                      name="horario_inicio"
                      render={() => <FormItem />}
                    />
                    <FormField
                      control={form.control}
                      name="horario_fim"
                      render={() => <FormItem />}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="local"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione o local" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locais.map((l: any) => (
                              <SelectItem key={l.id} value={l.nome}>
                                {l.nome} {l.endereco ? `- ${l.endereco}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 space-y-4">
                    {valorSessao > 0 && (
                      <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border">
                        <span className="text-base font-medium">Total a pagar:</span>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(Number((valorSessao * 1.05).toFixed(2)))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Inclui 5% de taxa da plataforma
                          </p>
                        </div>
                      </div>
                    )}
                    <Button type="submit" className="w-full h-12 text-lg font-bold">
                      Confirmar Agendamento
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
