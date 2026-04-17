import { Fragment, useEffect, useState, useMemo } from 'react'
import { startOfWeek, addDays, format, parseISO, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7)

const getDayName = (date: Date) => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return days[date.getDay()]
}

const getStatusColors = (status: string) => {
  switch (status) {
    case 'confirmado':
      return 'bg-emerald-100 border-emerald-300 text-emerald-800'
    case 'cancelado':
      return 'bg-rose-100 border-rose-300 text-rose-800'
    case 'pendente':
    default:
      return 'bg-amber-100 border-amber-300 text-amber-800'
  }
}

export function WeeklySchedule() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchProfile = async () => {
    if (!user) return
    try {
      const record = await pb.collection('profiles').getFirstListItem(`user_id = "${user.id}"`)
      setProfile(record)
    } catch (e) {
      console.error('Failed to fetch profile', e)
    }
  }

  const fetchAgendamentos = async () => {
    if (!user) return
    try {
      setLoading(true)
      let filter = ''
      if (user.user_type === 'responsavel') {
        const vinculos = await pb.collection('responsabilidade_vinculos').getFullList({
          filter: `responsavel_id = "${user.id}" && status = "aceito"`,
        })
        const depIds = vinculos.map((v) => v.dependente_id).filter(Boolean)
        if (depIds.length === 0) {
          setAgendamentos([])
          setLoading(false)
          return
        }
        filter = depIds.map((id) => `estudante_id = "${id}"`).join(' || ')
      } else if (user.user_type === 'student') {
        filter = `estudante_id = "${user.id}"`
      } else {
        filter = `monitor_id = "${user.id}"`
      }

      const records = await pb.collection('agendamentos').getFullList({
        filter,
        expand: 'estudante_id,monitor_id',
      })
      setAgendamentos(records)
    } catch (error) {
      console.error('Failed to fetch agendamentos for schedule', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
    fetchProfile()
  }, [user])

  useRealtime('agendamentos', () => {
    fetchAgendamentos()
  })

  useRealtime('profiles', () => {
    fetchProfile()
  })

  const parsedAvailability = useMemo(() => {
    if (!profile?.availability) return null
    try {
      return JSON.parse(profile.availability)
    } catch {
      return null
    }
  }, [profile?.availability])

  const isSlotAvailable = (dayIndex: number, hour: number) => {
    if (!parsedAvailability || Object.keys(parsedAvailability).length === 0) return true

    if (Array.isArray(parsedAvailability)) {
      const dayRules = parsedAvailability.filter(
        (a: any) => String(a.day) === String(dayIndex) || String(a.dayOfWeek) === String(dayIndex),
      )
      if (dayRules.length === 0) return false

      return dayRules.some((rule: any) => {
        const start = rule.startTime || rule.start || '00:00'
        const end = rule.endTime || rule.end || '24:00'
        const startHour = parseInt(start.split(':')[0], 10)
        const endHour = parseInt(end.split(':')[0], 10)
        return hour >= startHour && hour < endHour
      })
    }

    if (typeof parsedAvailability === 'object') {
      const dayRules = parsedAvailability[dayIndex] || parsedAvailability[String(dayIndex)]
      if (!dayRules || dayRules.length === 0) return false

      if (Array.isArray(dayRules)) {
        return dayRules.some((range: string) => {
          if (typeof range === 'string' && range.includes('-')) {
            const [start, end] = range.split('-')
            const startHour = parseInt(start?.split(':')[0] || '0', 10)
            const endHour = parseInt(end?.split(':')[0] || '24', 10)
            return hour >= startHour && hour < endHour
          }
          return true
        })
      }
    }

    return true
  }

  const mockAgendamentos = useMemo(() => {
    return [
      {
        id: 'mock1',
        assunto: 'Dúvidas de Cálculo I',
        data_agendamento: format(addDays(weekStart, 1), "yyyy-MM-dd 12:00:00.000'Z'"),
        horario_inicio: '10:00',
        horario_fim: '11:00',
        status: 'confirmado',
        expand: {
          monitor_id: { name: 'Prof. Silva' },
          estudante_id: { name: 'João (Filho)' },
        },
      },
      {
        id: 'mock2',
        assunto: 'Revisão de Física',
        data_agendamento: format(addDays(weekStart, 3), "yyyy-MM-dd 12:00:00.000'Z'"),
        horario_inicio: '14:00',
        horario_fim: '15:00',
        status: 'pendente',
        expand: {
          monitor_id: { name: 'Prof. Mendes' },
          estudante_id: { name: 'Ana Souza' },
        },
      },
      {
        id: 'mock3',
        assunto: 'Orientação de TCC',
        data_agendamento: format(addDays(weekStart, 4), "yyyy-MM-dd 12:00:00.000'Z'"),
        horario_inicio: '16:00',
        horario_fim: '17:00',
        status: 'cancelado',
        expand: {
          monitor_id: { name: 'Prof. Almeida' },
          estudante_id: { name: 'Carlos Lima' },
        },
      },
    ]
  }, [weekStart])

  const displayAgendamentos = agendamentos.length > 0 ? agendamentos : mockAgendamentos

  const appointmentsThisWeek = displayAgendamentos.filter((a) => {
    try {
      const datePart = a.data_agendamento.split(' ')[0]
      const d = parseISO(datePart)
      return weekDays.some((wd) => isSameDay(wd, d))
    } catch {
      return false
    }
  })

  const counterpartName = (app: any) => {
    if (user?.user_type === 'student' || user?.user_type === 'responsavel') {
      return app.expand?.monitor_id?.name || 'Monitor'
    }
    return app.expand?.estudante_id?.name || 'Estudante'
  }

  return (
    <Card className="shadow-elevation border-slate-200 overflow-hidden mb-6">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 border-b border-slate-100 bg-white pb-4 pt-5 px-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            Agenda Semanal
          </CardTitle>
          <CardDescription className="text-slate-500">
            {user?.user_type === 'responsavel'
              ? 'Visualize os horários e agendamentos dos seus dependentes'
              : 'Visualize seus horários e agendamentos da semana'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="h-8 w-8 hover:bg-white hover:shadow-sm transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <span className="text-sm font-semibold w-28 text-center text-slate-700">
            {format(weekDays[0], 'dd/MM')} - {format(weekDays[6], 'dd/MM')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="h-8 w-8 hover:bg-white hover:shadow-sm transition-all"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-auto bg-slate-50/30 max-h-[600px] relative">
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="min-w-[700px] lg:min-w-0 lg:w-full grid grid-cols-[45px_repeat(7,1fr)] md:grid-cols-[60px_repeat(7,1fr)]">
            {/* Header Sticky Corner */}
            <div className="border-r border-b border-slate-200 bg-white sticky top-0 left-0 z-30 shadow-sm"></div>

            {/* Days Header */}
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'border-r border-b border-slate-200 bg-white p-1.5 md:p-3 text-center sticky top-0 z-20 shadow-sm transition-colors',
                    isToday && 'bg-indigo-50/80',
                  )}
                >
                  <div
                    className={cn(
                      'text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5 md:mb-1 truncate',
                      isToday ? 'text-indigo-600' : 'text-slate-500',
                    )}
                  >
                    <span className="md:hidden">{getDayName(day).slice(0, 3)}</span>
                    <span className="hidden md:inline">{getDayName(day)}</span>
                  </div>
                  <div
                    className={cn(
                      'text-sm md:text-lg font-semibold mx-auto flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full',
                      isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-800',
                    )}
                  >
                    {format(day, 'dd')}
                  </div>
                </div>
              )
            })}

            {/* Time slots rows */}
            {HOURS.map((hour) => (
              <Fragment key={hour}>
                {/* Hours column (sticky) */}
                <div className="border-r border-b border-slate-200 bg-white p-1 text-right sticky left-0 z-10 flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-medium text-slate-400 -mt-1.5 md:-mt-2 block bg-white pr-0.5 md:pr-1 leading-none">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </span>
                </div>

                {/* Day cells for the hour */}
                {weekDays.map((day) => {
                  const cellAppointments = appointmentsThisWeek.filter((a) => {
                    try {
                      const datePart = a.data_agendamento.split(' ')[0]
                      const d = parseISO(datePart)
                      if (!isSameDay(d, day)) return false
                      const aHour = parseInt(a.horario_inicio?.split(':')[0] || '0', 10)
                      return aHour === hour
                    } catch {
                      return false
                    }
                  })

                  const available = isSlotAvailable(day.getDay(), hour)

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'border-r border-b border-slate-200/50 p-0.5 min-h-[38px] md:min-h-[45px] transition-colors relative group',
                        available
                          ? 'bg-transparent hover:bg-slate-50'
                          : 'bg-slate-800 hover:bg-slate-700',
                      )}
                    >
                      {cellAppointments.map((app) => (
                        <div
                          key={app.id}
                          className={cn(
                            'mb-0.5 md:mb-1 rounded-sm border px-1 py-0.5 md:p-1 text-[9px] md:text-[10px] shadow-sm flex flex-col gap-0.5 relative z-10 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default overflow-hidden',
                            getStatusColors(app.status),
                          )}
                        >
                          <div className="font-bold leading-tight truncate" title={app.assunto}>
                            {app.assunto}
                          </div>
                          <div className="mt-auto flex flex-row items-center justify-between opacity-90 text-[8px] md:text-[9px] font-medium gap-1">
                            <span
                              className="truncate max-w-[60px] md:max-w-[80px]"
                              title={counterpartName(app)}
                            >
                              {counterpartName(app)}
                            </span>
                            <span className="bg-white/40 px-0.5 md:px-1 rounded backdrop-blur-sm shadow-sm w-fit leading-tight">
                              {app.horario_inicio}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
