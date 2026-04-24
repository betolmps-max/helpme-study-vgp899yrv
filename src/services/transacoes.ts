import pb from '@/lib/pocketbase/client'

export interface Transacao {
  id: string
  user_id: string
  agendamento_id?: string
  tipo: 'deposito' | 'pagamento_sessao' | 'recebimento_sessao' | 'estorno' | 'resgate' | 'gorjeta'
  valor: number
  status: 'pendente' | 'concluido' | 'cancelado'
  created: string
  updated: string
}

export const getMyTransactions = async () => {
  return pb.collection('transacoes').getFullList<Transacao>({
    sort: '-created',
  })
}
