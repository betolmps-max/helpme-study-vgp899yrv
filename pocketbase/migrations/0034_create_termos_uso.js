migrate(
  (app) => {
    const termos = new Collection({
      name: 'termos_uso',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '@request.auth.is_admin = true',
      updateRule: '@request.auth.is_admin = true',
      deleteRule: '@request.auth.is_admin = true',
      fields: [
        { name: 'conteudo', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(termos)

    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new DateField({ name: 'termos_aceitos_em' }))
    app.save(users)
  },
  (app) => {
    const termos = app.findCollectionByNameOrId('termos_uso')
    app.delete(termos)

    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('termos_aceitos_em')
    app.save(users)
  },
)
