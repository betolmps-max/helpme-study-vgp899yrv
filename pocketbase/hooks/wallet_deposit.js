routerAdd(
  'POST',
  '/backend/v1/wallet/deposit',
  (e) => {
    const body = e.requestInfo().body
    const valor = parseFloat(body.valor)
    if (isNaN(valor) || valor <= 0) return e.badRequestError('Valor inválido.')

    $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById('users', e.auth.id)
      user.set('saldo_helps', (user.getFloat('saldo_helps') || 0) + valor)
      txApp.save(user)

      const txCol = txApp.findCollectionByNameOrId('transacoes')
      const tx = new Record(txCol)
      tx.set('user_id', user.id)
      tx.set('tipo', 'deposito')
      tx.set('valor', valor)
      tx.set('status', 'concluido')
      txApp.save(tx)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
