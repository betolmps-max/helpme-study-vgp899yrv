import { useState, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock, BookOpen, Star } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { createAgendamento } from '@/services/agendamentos'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 to 22:00

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
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState(false)
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { assunto: '', horario_inicio: '', horario_fim: '', local: '' },
  })

  const mentorUser = profile.expand?.user_id
  const name = mentorUser?.name || 'Usuário Sem Nome'
  const subjects = profile.subjects ? profile.subjects.split(',').map((s: string) => s.trim()) : []
  const media = mentorUser?.media_avaliacao || 0
  const totalAvaliacoes = mentorUser?.total_avaliacoes || 0

  const activeSlots = useMemo(
    () => parseAvailabilitySlots(profile.availability),
    [profile.availability],
  )

  const handleSlotClick = (dayIdx: number, hour: number) => {
    form.setValue('horario_inicio', `${String(hour).padStart(2, '0')}:00`)
    form.setValue('horario_fim', `${String(hour + 1).padStart(2, '0')}:00`)

    // dayIdx: 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sáb, 6=Dom
    const targetJsDay = dayIdx === 6 ? 0 : dayIdx + 1
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const currentDay = d.getDay()

    let diff = targetJsDay - currentDay
    if (diff < 0) {
      diff += 7
    }

    d.setDate(d.getDate() + diff)
    form.setValue('data_agendamento', d)
    setOpen(true)
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
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <Avatar className="h-16 w-16 border">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-lg line-clamp-1" title={name}>
            {name}
          </CardTitle>
          <CardDescription className="capitalize font-medium text-primary/80 flex flex-col gap-1 mt-1">
            <span>{mentorUser?.user_type === 'professor' ? 'Professor(a)' : 'Monitor(a)'}</span>
            {totalAvaliacoes > 0 && (
              <span className="flex items-center text-yellow-600 text-xs font-semibold">
                <Star className="h-3.5 w-3.5 fill-current mr-1" />
                {media.toFixed(1)}
                <span className="text-muted-foreground font-normal ml-1">
                  ({totalAvaliacoes} avaliações)
                </span>
              </span>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Disciplinas
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {subjects.length > 0 ? (
              subjects.map((s: string, i: number) => (
                <Badge key={i} variant="secondary" className="font-normal">
                  {s}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">Não informadas</span>
            )}
          </div>
        </div>
        {profile.bio && (
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Sobre
            </h4>
            <div
              className="group relative cursor-pointer select-none rounded-md transition-colors hover:bg-muted/30 p-1 -m-1"
              onDoubleClick={() => setIsBioExpanded(!isBioExpanded)}
              title="Dê um duplo clique para expandir/recolher"
            >
              <p
                className={cn(
                  'text-sm text-foreground/90 leading-relaxed transition-all duration-300 break-words',
                  !isBioExpanded && 'line-clamp-3',
                )}
              >
                {profile.bio}
              </p>
              {!isBioExpanded && profile.bio?.length > 100 && (
                <p className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Duplo clique para expandir
                </p>
              )}
            </div>
          </div>
        )}
        {profile.availability && (
          <div className="flex flex-col gap-1.5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Disponibilidade
            </h4>
            {activeSlots.size > 0 ? (
              <div className="border rounded-md overflow-hidden bg-background flex flex-col mt-1 shadow-sm">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b bg-muted/40">
                  <div className="p-1 text-[10px] font-medium text-center border-r w-10 shrink-0" />
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      className="py-1 px-0.5 text-[10px] font-medium text-center border-r last:border-0 truncate"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <ScrollArea className="h-[140px] w-full">
                  <div className="min-w-[220px]">
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b last:border-0"
                      >
                        <div className="py-1 px-0.5 text-[9px] text-muted-foreground text-center border-r w-10 shrink-0 flex items-center justify-center bg-muted/10">
                          {h}:00
                        </div>
                        {DAYS.map((_, dayIdx) => {
                          const isActive = activeSlots.has(`${dayIdx}-${h}`)
                          return (
                            <div
                              key={dayIdx}
                              role="button"
                              tabIndex={isActive ? 0 : -1}
                              onClick={() => {
                                if (isActive) handleSlotClick(dayIdx, h)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  if (isActive) handleSlotClick(dayIdx, h)
                                }
                              }}
                              className={cn(
                                'border-r last:border-0 transition-colors h-6',
                                isActive
                                  ? 'bg-primary/40 hover:bg-primary/60 cursor-pointer border-primary/20'
                                  : 'bg-transparent hover:bg-muted/30 cursor-default',
                              )}
                              title={isActive ? `Agendar ${DAYS[dayIdx]} às ${h}:00` : undefined}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
                <div className="bg-muted/20 p-1 text-center border-t">
                  <p className="text-[10px] text-muted-foreground">
                    * Clique num horário verde para agendar
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="group relative cursor-pointer select-none rounded-md transition-colors hover:bg-muted/30 p-1 -m-1 overflow-hidden"
                onDoubleClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
                title="Dê um duplo clique para expandir/recolher"
              >
                <p
                  className={cn(
                    'text-sm text-foreground/90 transition-all duration-300 break-words',
                    !isAvailabilityExpanded && 'line-clamp-3',
                  )}
                >
                  {profile.availability}
                </p>
                {!isAvailabilityExpanded && profile.availability?.length > 100 && (
                  <p className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Duplo clique para expandir
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Agendar Sessão</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agendar com {name}</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo para solicitar um agendamento.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="assunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto / Disciplina</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                <FormField
                  control={form.control}
                  name="data_agendamento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span>Escolha uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="horario_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início (HH:MM)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="horario_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim (HH:MM)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                          <SelectTrigger>
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
                <div className="pt-2">
                  <Button type="submit" className="w-full">
                    Confirmar Agendamento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
