migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('user_type')) {
      users.fields.add(
        new SelectField({
          name: 'user_type',
          values: ['professor', 'monitor', 'student'],
          maxSelect: 1,
          required: true,
        }),
      )
      app.save(users)
    }

    const profiles = new Collection({
      name: 'profiles',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'subjects', type: 'text' },
        { name: 'bio', type: 'text' },
        { name: 'availability', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(profiles)
  },
  (app) => {
    try {
      const profiles = app.findCollectionByNameOrId('profiles')
      app.delete(profiles)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('users')
      users.fields.removeByName('user_type')
      app.save(users)
    } catch (_) {}
  },
)
