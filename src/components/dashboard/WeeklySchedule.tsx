import { Fragment, useEffect, useState, useMemo, useRef } from 'react'
import { startOfWeek, addDays, format, parseISO, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
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
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [activeCell, setActiveCell] = useState<{
    day: Date
    hour: number
    dayIndex: number
  } | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

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
    if (!parsedAvailability || Object.keys(parsedAvailability).length === 0) return false

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

  const displayAgendamentos = agendamentos

  const handleInteract = (day: Date, hour: number, dayIndex: number) => {
    setActiveCell({ day, hour, dayIndex })
    setIsMenuOpen(true)
  }

  const handleTouchStart = (day: Date, hour: number, dayIndex: number) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      handleInteract(day, hour, dayIndex)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleMakeAvailable = async () => {
    if (!activeCell || !profile) return
    setIsMenuOpen(false)
    const loadingToast = toast.loading('Atualizando disponibilidade...')

    try {
      const dayIdx = activeCell.dayIndex
      const startStr = `${activeCell.hour.toString().padStart(2, '0')}:00`
      const endStr = `${(activeCell.hour + 1).toString().padStart(2, '0')}:00`
      const newRange = `${startStr}-${endStr}`

      let currentAvail = parsedAvailability ? JSON.parse(JSON.stringify(parsedAvailability)) : {}

      if (Array.isArray(currentAvail)) {
        currentAvail.push({
          day: dayIdx,
          startTime: startStr,
          endTime: endStr,
        })
      } else {
        if (!currentAvail[dayIdx]) currentAvail[dayIdx] = []
        if (!currentAvail[dayIdx].includes(newRange)) {
          currentAvail[dayIdx].push(newRange)
        }
      }

      await pb.collection('profiles').update(profile.id, {
        availability: JSON.stringify(currentAvail),
      })

      toast.success('Horário disponibilizado!', { id: loadingToast })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar disponibilidade', { id: loadingToast })
    }
  }

  const handleRemoveAvailability = async () => {
    if (!activeCell || !profile) return
    setIsMenuOpen(false)
    const loadingToast = toast.loading('Atualizando disponibilidade...')

    try {
      const dayIdx = activeCell.dayIndex
      const startStr = `${activeCell.hour.toString().padStart(2, '0')}:00`
      const endStr = `${(activeCell.hour + 1).toString().padStart(2, '0')}:00`
      const rangeToRemove = `${startStr}-${endStr}`

      let currentAvail = parsedAvailability ? JSON.parse(JSON.stringify(parsedAvailability)) : {}

      if (Array.isArray(currentAvail)) {
        currentAvail = currentAvail.filter(
          (a: any) =>
            !(
              String(a.day) === String(dayIdx) &&
              (a.startTime === startStr || a.start === startStr)
            ),
        )
      } else {
        if (currentAvail[dayIdx]) {
          currentAvail[dayIdx] = currentAvail[dayIdx].filter(
            (range: string) => range !== rangeToRemove,
          )
        }
      }

      await pb.collection('profiles').update(profile.id, {
        availability: JSON.stringify(currentAvail),
      })

      toast.success('Horário bloqueado!', { id: loadingToast })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar disponibilidade', { id: loadingToast })
    }
  }

  const handleCancelAppointment = async () => {
    if (!activeCell) return
    setIsMenuOpen(false)
    const loadingToast = toast.loading('Cancelando agendamento...')

    try {
      const cellAppointments = displayAgendamentos.filter((a) => {
        try {
          const datePart = a.data_agendamento.split(' ')[0]
          const d = parseISO(datePart)
          if (!isSameDay(d, activeCell.day)) return false
          const aHour = parseInt(a.horario_inicio?.split(':')[0] || '0', 10)
          return aHour === activeCell.hour
        } catch {
          return false
        }
      })

      const activeApps = cellAppointments.filter((a) => a.status !== 'cancelado')

      if (activeApps.length === 0) {
        toast.error('Nenhum agendamento ativo neste horário.', { id: loadingToast })
        return
      }

      for (const app of activeApps) {
        if (app.id.startsWith('mock')) {
          toast.success('Agendamento mockado cancelado (simulação).', { id: loadingToast })
          continue
        }
        await pb.collection('agendamentos').update(app.id, {
          status: 'cancelado',
        })
      }

      toast.success('Agendamento cancelado com sucesso!', { id: loadingToast })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao cancelar agendamento', { id: loadingToast })
    }
  }

  const activeAgendamentos = displayAgendamentos.filter(
    (a) => a.status === 'pendente' || a.status === 'confirmado',
  )

  const appointmentsThisWeek = activeAgendamentos.filter((a) => {
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

                  const isCellActive =
                    activeCell?.dayIndex === day.getDay() && activeCell?.hour === hour

                  return (
                    <Popover
                      key={`${day.toISOString()}-${hour}`}
                      open={isCellActive && isMenuOpen}
                      onOpenChange={(open) => {
                        if (!open) setIsMenuOpen(false)
                      }}
                    >
                      <PopoverTrigger asChild>
                        <div
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            handleInteract(day, hour, day.getDay())
                          }}
                          onTouchStart={() => handleTouchStart(day, hour, day.getDay())}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchEnd}
                          className={cn(
                            'border-r border-b border-slate-200/50 p-0.5 min-h-[38px] md:min-h-[45px] transition-colors relative group cursor-pointer select-none',
                            available && cellAppointments.length === 0
                              ? 'bg-transparent hover:bg-indigo-50/50'
                              : !available && cellAppointments.length === 0
                                ? 'bg-slate-100 hover:bg-slate-200/50'
                                : 'bg-transparent hover:bg-slate-50',
                            isCellActive && isMenuOpen && 'ring-2 ring-indigo-500 ring-inset z-20',
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
                      </PopoverTrigger>
                      {isCellActive && (
                        <PopoverContent
                          className="w-56 p-1 flex flex-col gap-0.5 shadow-lg border-slate-200 z-50"
                          align="start"
                          side="bottom"
                          sideOffset={2}
                        >
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mb-1 border-b border-slate-100">
                            Ações ({format(day, 'dd/MM')} às {hour.toString().padStart(2, '0')}:00)
                          </div>

                          {cellAppointments.length === 0 ? (
                            <>
                              {!available ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start font-medium text-xs h-8 px-2"
                                  onClick={handleMakeAvailable}
                                >
                                  Disponibilizar horário
                                </Button>
                              ) : (
                                <>
                                  {(user?.user_type === 'student' ||
                                    user?.user_type === 'responsavel') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="justify-start font-medium text-xs h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => {
                                        setIsMenuOpen(false)
                                        navigate('/buscar-monitores')
                                      }}
                                    >
                                      Buscar monitor
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start font-medium text-xs h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={handleRemoveAvailability}
                                  >
                                    Remover disponibilidade
                                  </Button>
                                </>
                              )}
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start font-medium text-xs h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={handleCancelAppointment}
                            >
                              Cancelar Agendamento
                            </Button>
                          )}
                        </PopoverContent>
                      )}
                    </Popover>
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
