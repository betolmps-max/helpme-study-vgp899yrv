import pb from '@/lib/pocketbase/client'

export const depositHelps = (valor: number) =>
  pb.send('/backend/v1/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify({ valor }),
    headers: { 'Content-Type': 'application/json' },
  })

export const payAgendamento = (agendamento_id: string, method: string) =>
  pb.send('/backend/v1/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ agendamento_id, method }),
    headers: { 'Content-Type': 'application/json' },
  })

export const withdrawHelps = (valor: number, detalhes_pagamento: string) =>
  pb.send('/backend/v1/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ valor, detalhes_pagamento }),
    headers: { 'Content-Type': 'application/json' },
  })

export const sendTip = (agendamento_id: string, valor: number) =>
  pb.send('/backend/v1/wallet/tip', {
    method: 'POST',
    body: JSON.stringify({ agendamento_id, valor }),
    headers: { 'Content-Type': 'application/json' },
  })
