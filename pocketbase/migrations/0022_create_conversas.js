migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const agendamentosCol = app.findCollectionByNameOrId('agendamentos')

    const collection = new Collection({
      name: 'conversas',
      type: 'base',
      listRule: 'participantes ~ @request.auth.id',
      viewRule: 'participantes ~ @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'participantes ~ @request.auth.id',
      deleteRule: 'participantes ~ @request.auth.id',
      fields: [
        {
          name: 'participantes',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 100,
        },
        {
          name: 'agendamento_id',
          type: 'relation',
          required: false,
          collectionId: agendamentosCol.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('conversas')
    app.delete(collection)
  },
)
