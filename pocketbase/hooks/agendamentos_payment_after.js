onRecordAfterCreateSuccess((e) => {
  const valorSessao = e.record.getFloat('valor_pago') || 0
  const estudanteId = e.record.get('estudante_id')

  if (valorSessao > 0) {
    try {
      $app.runInTransaction((txApp) => {
        const estudante = txApp.findRecordById('users', estudanteId)
        const saldo = estudante.getFloat('saldo_helps') || 0

        if (saldo < valorSessao) {
          e.record.set('status', 'cancelado')
          txApp.save(e.record)
          return
        }

        estudante.set('saldo_helps', saldo - valorSessao)
        txApp.save(estudante)

        const txCol = txApp.findCollectionByNameOrId('transacoes')
        const tx = new Record(txCol)
        tx.set('user_id', estudanteId)
        tx.set('agendamento_id', e.record.id)
        tx.set('tipo', 'pagamento_sessao')
        tx.set('valor', -valorSessao)
        tx.set('status', 'concluido')
        txApp.save(tx)
      })
    } catch (err) {
      console.log('Error processing payment deduction:', err)
    }
  }
  e.next()
}, 'agendamentos')
