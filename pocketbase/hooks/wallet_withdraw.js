routerAdd(
  'POST',
  '/backend/v1/wallet/withdraw',
  (e) => {
    const body = e.requestInfo().body
    const valor = parseFloat(body.valor)
    const detalhes = body.detalhes_pagamento

    if (isNaN(valor) || valor <= 0 || !detalhes) return e.badRequestError('Pedido inválido.')

    $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById('users', e.auth.id)
      const saldo = user.getFloat('saldo_helps') || 0
      if (saldo < valor) throw new BadRequestError('Saldo insuficiente.')

      user.set('saldo_helps', saldo - valor)
      txApp.save(user)

      const srCol = txApp.findCollectionByNameOrId('solicitacoes_resgate')
      const sr = new Record(srCol)
      sr.set('user_id', user.id)
      sr.set('valor', valor)
      sr.set('detalhes_pagamento', detalhes)
      sr.set('status', 'pendente')
      txApp.save(sr)

      const txCol = txApp.findCollectionByNameOrId('transacoes')
      const tx = new Record(txCol)
      tx.set('user_id', user.id)
      tx.set('tipo', 'resgate')
      tx.set('valor', -valor)
      tx.set('status', 'pendente')
      txApp.save(tx)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
