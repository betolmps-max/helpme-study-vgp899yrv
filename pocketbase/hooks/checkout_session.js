routerAdd(
  'POST',
  '/backend/v1/checkout/session',
  (e) => {
    const body = e.requestInfo().body
    const agendamentoId = body.agendamento_id
    const method = body.method

    if (!agendamentoId || !method) {
      return e.badRequestError('Parâmetros ausentes')
    }

    return $app.runInTransaction((txApp) => {
      let agendamento
      try {
        agendamento = txApp.findRecordById('agendamentos', agendamentoId)
      } catch (_) {
        return e.notFoundError('Agendamento não encontrado')
      }

      if (agendamento.getString('status') !== 'pendente') {
        return e.badRequestError('Agendamento já processado ou cancelado')
      }

      const valorPago = agendamento.getFloat('valor_pago')
      if (valorPago <= 0) {
        return e.badRequestError('Valor do agendamento inválido')
      }

      let user
      try {
        user = txApp.findRecordById('users', e.auth.id)
      } catch (_) {
        return e.unauthorizedError('Usuário não encontrado')
      }

      if (method === 'wallet') {
        const saldo = user.getFloat('saldo')
        if (saldo < valorPago) {
          return e.badRequestError('Saldo insuficiente na carteira')
        }
        user.set('saldo', saldo - valorPago)
        txApp.save(user)
      }

      agendamento.set('status', 'confirmado')
      txApp.save(agendamento)

      const transacoes = txApp.findCollectionByNameOrId('transacoes')
      const transacao = new Record(transacoes)
      transacao.set('user_id', user.id)
      transacao.set('agendamento_id', agendamento.id)
      transacao.set('tipo', 'pagamento_sessao')
      transacao.set('valor', valorPago)
      transacao.set('status', 'concluido')
      txApp.save(transacao)

      return e.json(200, { success: true, message: 'Pagamento processado com sucesso' })
    })
  },
  $apis.requireAuth(),
)
