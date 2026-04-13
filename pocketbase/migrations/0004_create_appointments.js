migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id

    const collection = new Collection({
      name: 'appointments',
      type: 'base',
      listRule:
        '@request.auth.is_admin = true || student_id = @request.auth.id || provider_id = @request.auth.id',
      viewRule:
        '@request.auth.is_admin = true || student_id = @request.auth.id || provider_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule:
        '@request.auth.is_admin = true || student_id = @request.auth.id || provider_id = @request.auth.id',
      deleteRule: '@request.auth.is_admin = true',
      fields: [
        {
          name: 'student_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
        },
        {
          name: 'provider_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
        },
        { name: 'scheduled_at', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'confirmed', 'completed', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('appointments')
    app.delete(collection)
  },
)
