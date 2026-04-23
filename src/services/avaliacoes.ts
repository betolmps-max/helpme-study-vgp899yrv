import pb from '@/lib/pocketbase/client'

export interface Avaliacao {
  id?: string
  agendamento_id: string
  avaliador_id: string
  avaliado_id: string
  nota: number
  comentario?: string
}

export const createAvaliacao = (data: Avaliacao) => {
  return pb.collection('avaliacoes').create(data)
}

export const getAvaliacoesByUser = (userId: string) => {
  return pb.collection('avaliacoes').getFullList({
    filter: `avaliador_id = "${userId}"`,
  })
}
