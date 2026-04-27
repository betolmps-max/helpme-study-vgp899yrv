routerAdd(
  'POST',
  '/backend/v1/wallet/deposit',
  (e) => {
    const body = e.requestInfo().body
    const valorBrl = parseFloat(body.valor)
    if (isNaN(valorBrl) || valorBrl <= 0) return e.badRequestError('Valor inválido.')

    $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById('users', e.auth.id)
      user.set('saldo', (user.getFloat('saldo') || 0) + valorBrl)
      txApp.save(user)

      const txCol = txApp.findCollectionByNameOrId('transacoes')
      const tx = new Record(txCol)
      tx.set('user_id', user.id)
      tx.set('tipo', 'deposito')
      tx.set('valor', valorBrl)
      tx.set('status', 'concluido')
      txApp.save(tx)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
