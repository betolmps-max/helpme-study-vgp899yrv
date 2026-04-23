migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.add(new BoolField({ name: 'notificacoes_email' }))
    app.save(col)

    try {
      app.db().newQuery('UPDATE users SET notificacoes_email = 1').execute()
    } catch (err) {
      console.log('Failed to set default notificacoes_email:', err)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('notificacoes_email')
    app.save(col)
  },
)
