import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createAgendamento } from '@/services/agendamentos'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState, useEffect } from 'react'
import { getLocaisList } from '@/services/locais'
import { getProfileByUserId } from '@/services/profiles'

const formSchema = z.object({
  monitor_id: z.string({ required_error: 'Selecione um monitor.' }),
  assunto: z.string().min(3, 'O assunto deve ter pelo menos 3 caracteres.'),
  data_agendamento: z.date({ required_error: 'Selecione uma data.' }),
  horario_inicio: z.string().min(1, 'Horário de início é obrigatório.'),
  horario_fim: z.string().min(1, 'Horário de término é obrigatório.'),
  local: z.string().optional(),
  local_id: z.string().optional(),
})

interface AgendamentoFormProps {
  monitors: any[]
  userId: string
  onSuccess: () => void
}

export function AgendamentoForm({ monitors, userId, onSuccess }: AgendamentoFormProps) {
  const [locais, setLocais] = useState<any[]>([])
  const [selectedMonitorProfile, setSelectedMonitorProfile] = useState<any>(null)

  useEffect(() => {
    getLocaisList().then(setLocais).catch(console.error)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assunto: '',
      horario_inicio: '',
      horario_fim: '',
      local: '',
      local_id: 'none',
    },
  })

  useEffect(() => {
    const monId = form.watch('monitor_id')
    if (monId && monId !== 'none') {
      getProfileByUserId(monId)
        .then(setSelectedMonitorProfile)
        .catch(() => setSelectedMonitorProfile(null))
    } else {
      setSelectedMonitorProfile(null)
    }
  }, [form.watch('monitor_id')])

  const valorSessao = selectedMonitorProfile?.valor_sessao || 0

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data: any = {
        estudante_id: userId,
        monitor_id: values.monitor_id,
        assunto: values.assunto,
        data_agendamento: values.data_agendamento.toISOString(),
        horario_inicio: values.horario_inicio,
        horario_fim: values.horario_fim,
        local: values.local,
        status: 'pendente',
      }

      if (values.local_id && values.local_id !== 'none') {
        data.local_id = values.local_id
      }

      await createAgendamento(data)
      toast.success('Agendamento criado com sucesso!')
      form.reset()
      onSuccess()
    } catch (error) {
      toast.error('Erro ao criar agendamento.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="monitor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monitor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o monitor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {monitors.length > 0 ? (
                    monitors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name || m.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum monitor disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
              {valorSessao > 0 && (
                <div className="mt-2 p-3 bg-primary/10 text-primary-foreground rounded-md text-sm border border-primary/20">
                  <p className="text-primary font-medium">Preço da sessão: {valorSessao} Helps</p>
                </div>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assunto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Dúvidas em Cálculo 1" {...field} />
              </FormControl>
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
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
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
                <FormLabel>Início</FormLabel>
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
                <FormLabel>Fim</FormLabel>
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
          name="local_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local Físico (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um local físico" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum / Definir manual</SelectItem>
                  {locais.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome}
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
          name="local"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localização / Link (Se não usar o local físico)</FormLabel>
              <FormControl>
                <Input placeholder="Sala 101 ou Link do Meet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Agendar
        </Button>
      </form>
    </Form>
  )
}
