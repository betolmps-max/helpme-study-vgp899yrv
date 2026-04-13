migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('is_admin')) {
      users.fields.add(new BoolField({ name: 'is_admin' }))
    }

    // Allow admins to list, view, and update users
    users.listRule = 'id = @request.auth.id || @request.auth.is_admin = true'
    users.viewRule = 'id = @request.auth.id || @request.auth.is_admin = true'
    users.updateRule = 'id = @request.auth.id || @request.auth.is_admin = true'

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.removeByName('is_admin')

    // Revert to original rules
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'

    app.save(users)
  },
)
