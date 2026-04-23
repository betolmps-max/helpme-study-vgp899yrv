migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new NumberField({ name: 'saldo_helps', min: 0 }))
    app.save(users)

    const profiles = app.findCollectionByNameOrId('profiles')
    profiles.fields.add(new NumberField({ name: 'valor_sessao', min: 0 }))
    app.save(profiles)

    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    agendamentos.fields.add(new NumberField({ name: 'valor_pago', min: 0 }))
    app.save(agendamentos)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('saldo_helps')
    app.save(users)

    const profiles = app.findCollectionByNameOrId('profiles')
    profiles.fields.removeByName('valor_sessao')
    app.save(profiles)

    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    agendamentos.fields.removeByName('valor_pago')
    app.save(agendamentos)
  },
)
