migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id || @request.auth.is_admin = true'
    users.viewRule = 'id = @request.auth.id || @request.auth.is_admin = true'
    app.save(users)
  },
)
