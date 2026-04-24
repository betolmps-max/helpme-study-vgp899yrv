routerAdd(
  'POST',
  '/backend/v1/wallet/withdraw',
  (e) => {
    const body = e.requestInfo().body
    const valorHelps = parseFloat(body.valor)
    const detalhes = body.detalhes_pagamento

    if (isNaN(valorHelps) || valorHelps <= 0 || !detalhes)
      return e.badRequestError('Pedido inválido.')

    const valorBrl = valorHelps / 10

    $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById('users', e.auth.id)
      const saldo = user.getFloat('saldo_helps') || 0
      if (saldo < valorHelps) throw new BadRequestError('Saldo insuficiente.')

      user.set('saldo_helps', saldo - valorHelps)
      txApp.save(user)

      const srCol = txApp.findCollectionByNameOrId('solicitacoes_resgate')
      const sr = new Record(srCol)
      sr.set('user_id', user.id)
      sr.set('valor', valorBrl)
      sr.set('detalhes_pagamento', detalhes)
      sr.set('status', 'pendente')
      txApp.save(sr)

      const txCol = txApp.findCollectionByNameOrId('transacoes')
      const tx = new Record(txCol)
      tx.set('user_id', user.id)
      tx.set('tipo', 'resgate')
      tx.set('valor', -valorHelps)
      tx.set('status', 'pendente')
      txApp.save(tx)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
