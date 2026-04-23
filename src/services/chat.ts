import pb from '@/lib/pocketbase/client'

export interface Conversa {
  id: string
  participantes: string[]
  agendamento_id?: string
  created: string
  updated: string
  expand?: {
    participantes?: any[]
    agendamento_id?: any
  }
}

export interface Mensagem {
  id: string
  conversa_id: string
  remetente_id: string
  conteudo: string
  created: string
  expand?: {
    remetente_id?: any
  }
}

export const getConversas = async (userId: string) => {
  return pb.collection('conversas').getFullList<Conversa>({
    filter: `participantes ~ "${userId}"`,
    expand: 'participantes,agendamento_id',
    sort: '-updated',
  })
}

export const getMensagens = async (conversaId: string) => {
  return pb.collection('mensagens').getFullList<Mensagem>({
    filter: `conversa_id = "${conversaId}"`,
    expand: 'remetente_id',
    sort: 'created',
  })
}

export const enviarMensagem = async (conversaId: string, remetenteId: string, conteudo: string) => {
  const msg = await pb.collection('mensagens').create<Mensagem>({
    conversa_id: conversaId,
    remetente_id: remetenteId,
    conteudo,
  })

  // Atualiza o updated da conversa para que ela suba na lista
  await pb.collection('conversas').update(conversaId, { updated: new Date().toISOString() })

  return msg
}

export const getOrCreateConversa = async (participantes: string[], agendamentoId?: string) => {
  let filter = ''
  if (agendamentoId) {
    filter = `agendamento_id = "${agendamentoId}"`
  } else {
    filter = participantes.map((p) => `participantes ~ "${p}"`).join(' && ')
  }

  const existing = await pb
    .collection('conversas')
    .getFullList<Conversa>({ filter, expand: 'participantes' })

  const match = existing.find((c) => {
    if (agendamentoId) return true
    return (
      c.participantes.length === participantes.length &&
      participantes.every((p) => c.participantes.includes(p))
    )
  })

  if (match) return match

  return pb.collection('conversas').create<Conversa>({
    participantes,
    agendamento_id: agendamentoId || null,
  })
}
