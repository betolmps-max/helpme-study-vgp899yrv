migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const conversasCol = app.findCollectionByNameOrId('conversas')

    const collection = new Collection({
      name: 'mensagens',
      type: 'base',
      listRule: 'conversa_id.participantes ~ @request.auth.id',
      viewRule: 'conversa_id.participantes ~ @request.auth.id',
      createRule: 'conversa_id.participantes ~ @request.auth.id',
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'conversa_id',
          type: 'relation',
          required: true,
          collectionId: conversasCol.id,
          maxSelect: 1,
        },
        {
          name: 'remetente_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        { name: 'conteudo', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('mensagens')
    app.delete(collection)
  },
)
