import pb from '@/lib/pocketbase/client'

export interface Agendamento {
  id: string
  estudante_id: string
  monitor_id: string
  assunto: string
  data_agendamento: string
  horario_inicio?: string
  horario_fim?: string
  local?: string
  local_id?: string
  status: 'pendente' | 'confirmado' | 'cancelado'
  created: string
  updated: string
  expand?: {
    estudante_id?: Record<string, any>
    monitor_id?: Record<string, any>
    local_id?: Record<string, any>
  }
}

export const getAgendamentos = () =>
  pb.collection('agendamentos').getFullList<Agendamento>({
    sort: '-data_agendamento',
    expand: 'estudante_id,monitor_id,local_id',
  })

export const getAgendamentosPorMonitor = (monitorId: string) =>
  pb.collection('agendamentos').getFullList<Agendamento>({
    filter: `monitor_id = "${monitorId}"`,
    sort: '-data_agendamento',
    expand: 'estudante_id,monitor_id,local_id',
  })

export const getAgendamentosPorLider = (liderId: string) =>
  pb.collection('agendamentos').getFullList<Agendamento>({
    filter: `local_id.lider_id = "${liderId}"`,
    sort: '-data_agendamento',
    expand: 'estudante_id,monitor_id,local_id',
  })

export const getAgendamento = (id: string) =>
  pb.collection('agendamentos').getOne<Agendamento>(id, {
    expand: 'estudante_id,monitor_id,local_id',
  })

export const createAgendamento = (data: Partial<Agendamento>) =>
  pb.collection('agendamentos').create<Agendamento>(data)

export const updateAgendamento = (id: string, data: Partial<Agendamento>) =>
  pb.collection('agendamentos').update<Agendamento>(id, data)

export const deleteAgendamento = (id: string) => pb.collection('agendamentos').delete(id)
