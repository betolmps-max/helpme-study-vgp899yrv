migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(new NumberField({ name: 'media_avaliacao' }))
    users.fields.add(new NumberField({ name: 'total_avaliacoes' }))
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('media_avaliacao')
    users.fields.removeByName('total_avaliacoes')
    app.save(users)
  },
)
