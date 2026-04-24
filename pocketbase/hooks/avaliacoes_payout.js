onRecordAfterCreateSuccess((e) => {
  const agendamentoId = e.record.get('agendamento_id')
  const nota = e.record.getInt('nota')

  try {
    const agendamento = $app.findRecordById('agendamentos', agendamentoId)
    const valorPago = agendamento.getFloat('valor_pago') || 0

    if (valorPago > 0) {
      const existingTx = $app.findRecordsByFilter(
        'transacoes',
        "agendamento_id = {:id} && tipo = 'recebimento_sessao'",
        '-created',
        1,
        0,
        { id: agendamentoId },
      )
      if (existingTx.length > 0) return e.next()

      const monitorId = agendamento.get('monitor_id')
      const estudanteId = agendamento.get('estudante_id')
      let valorMonitor = 0
      let valorEstudante = 0

      if (nota >= 4) {
        valorMonitor = valorPago * 0.98
      } else if (nota >= 2) {
        valorMonitor = valorPago * 0.5 * 0.98
        valorEstudante = valorPago * 0.5
      } else {
        valorMonitor = valorPago * 0.1
        valorEstudante = valorPago * 0.9
      }

      $app.runInTransaction((txApp) => {
        const txCol = txApp.findCollectionByNameOrId('transacoes')

        if (valorMonitor > 0) {
          const monitor = txApp.findRecordById('users', monitorId)
          monitor.set('saldo_helps', (monitor.getFloat('saldo_helps') || 0) + valorMonitor)
          txApp.save(monitor)

          const txM = new Record(txCol)
          txM.set('user_id', monitorId)
          txM.set('agendamento_id', agendamentoId)
          txM.set('tipo', 'recebimento_sessao')
          txM.set('valor', valorMonitor)
          txM.set('status', 'concluido')
          txApp.save(txM)
        }

        if (valorEstudante > 0) {
          const estudante = txApp.findRecordById('users', estudanteId)
          estudante.set('saldo_helps', (estudante.getFloat('saldo_helps') || 0) + valorEstudante)
          txApp.save(estudante)

          const txE = new Record(txCol)
          txE.set('user_id', estudanteId)
          txE.set('agendamento_id', agendamentoId)
          txE.set('tipo', 'estorno')
          txE.set('valor', valorEstudante)
          txE.set('status', 'concluido')
          txApp.save(txE)
        }
      })
    }
  } catch (err) {
    console.log('Error in avaliacoes payout:', err)
  }
  e.next()
}, 'avaliacoes')
