import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock, BookOpen } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
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

const bookingSchema = z.object({
  assunto: z.string().min(1, 'Obrigatório'),
  data_agendamento: z.date({ required_error: 'Obrigatório' }),
  horario_inicio: z.string().min(1, 'Obrigatório'),
  horario_fim: z.string().min(1, 'Obrigatório'),
  local: z.string().min(1, 'Obrigatório'),
})

export function MentorCard({ profile, user, disciplinas, locais, onBooked }: any) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { assunto: '', horario_inicio: '', horario_fim: '', local: '' },
  })

  const mentorUser = profile.expand?.user_id
  const name = mentorUser?.name || 'Usuário Sem Nome'
  const subjects = profile.subjects ? profile.subjects.split(',').map((s: string) => s.trim()) : []

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
          <CardDescription className="capitalize font-medium text-primary/80">
            {mentorUser?.user_type === 'professor' ? 'Professor(a)' : 'Monitor(a)'}
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
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Sobre
            </h4>
            <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">{profile.bio}</p>
          </div>
        )}
        {profile.availability && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Disponibilidade
            </h4>
            <p className="text-sm text-foreground/90">{profile.availability}</p>
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
