migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new SelectField({
        name: 'user_type',
        required: true,
        values: ['professor', 'monitor', 'student', 'responsavel'],
        maxSelect: 1,
      }),
    )
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new SelectField({
        name: 'user_type',
        required: true,
        values: ['professor', 'monitor', 'student'],
        maxSelect: 1,
      }),
    )
    app.save(users)
  },
)
