routerAdd(
  'POST',
  '/backend/v1/wallet/tip',
  (e) => {
    const body = e.requestInfo().body
    const agendamentoId = body.agendamento_id
    const valor = parseFloat(body.valor)

    if (!agendamentoId || isNaN(valor) || valor <= 0) {
      return e.badRequestError('Gorjeta inválida.')
    }

    $app.runInTransaction((txApp) => {
      const agendamento = txApp.findRecordById('agendamentos', agendamentoId)
      const estudanteId = agendamento.get('estudante_id')
      const monitorId = agendamento.get('monitor_id')

      if (e.auth?.id !== estudanteId)
        throw new BadRequestError('Apenas o estudante pode dar gorjeta.')

      const estudante = txApp.findRecordById('users', estudanteId)
      const saldo = estudante.getFloat('saldo') || 0
      if (saldo < valor) throw new BadRequestError('Saldo insuficiente para a gorjeta.')

      estudante.set('saldo', saldo - valor)
      txApp.save(estudante)

      const monitor = txApp.findRecordById('users', monitorId)
      monitor.set('saldo', (monitor.getFloat('saldo') || 0) + valor)
      txApp.save(monitor)

      const txCol = txApp.findCollectionByNameOrId('transacoes')

      const txE = new Record(txCol)
      txE.set('user_id', estudanteId)
      txE.set('agendamento_id', agendamentoId)
      txE.set('tipo', 'gorjeta')
      txE.set('valor', -valor)
      txE.set('status', 'concluido')
      txApp.save(txE)

      const txM = new Record(txCol)
      txM.set('user_id', monitorId)
      txM.set('agendamento_id', agendamentoId)
      txM.set('tipo', 'gorjeta')
      txM.set('valor', valor)
      txM.set('status', 'concluido')
      txApp.save(txM)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
