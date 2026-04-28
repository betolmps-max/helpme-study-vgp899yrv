migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('tutorial_visto')) {
      users.fields.add(new BoolField({ name: 'tutorial_visto' }))
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('tutorial_visto')
    app.save(users)
  },
)
