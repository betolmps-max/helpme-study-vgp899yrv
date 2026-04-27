migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('saldo')) {
      usersCol.fields.add(new NumberField({ name: 'saldo' }))
      app.save(usersCol)
    }

    app
      .db()
      .newQuery(
        'UPDATE users SET saldo = saldo_helps / 10 WHERE saldo_helps IS NOT NULL AND saldo_helps > 0',
      )
      .execute()
    app
      .db()
      .newQuery(
        'UPDATE profiles SET valor_sessao = valor_sessao / 10 WHERE valor_sessao IS NOT NULL AND valor_sessao > 0',
      )
      .execute()
    app
      .db()
      .newQuery(
        'UPDATE agendamentos SET valor_pago = valor_pago / 10 WHERE valor_pago IS NOT NULL AND valor_pago > 0',
      )
      .execute()
    app
      .db()
      .newQuery('UPDATE transacoes SET valor = valor / 10 WHERE valor IS NOT NULL AND valor != 0')
      .execute()
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    if (usersCol.fields.getByName('saldo')) {
      usersCol.fields.removeByName('saldo')
      app.save(usersCol)
    }

    app
      .db()
      .newQuery(
        'UPDATE profiles SET valor_sessao = valor_sessao * 10 WHERE valor_sessao IS NOT NULL AND valor_sessao > 0',
      )
      .execute()
    app
      .db()
      .newQuery(
        'UPDATE agendamentos SET valor_pago = valor_pago * 10 WHERE valor_pago IS NOT NULL AND valor_pago > 0',
      )
      .execute()
    app
      .db()
      .newQuery('UPDATE transacoes SET valor = valor * 10 WHERE valor IS NOT NULL AND valor != 0')
      .execute()
  },
)
