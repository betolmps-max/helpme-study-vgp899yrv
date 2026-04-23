migrate(
  (app) => {
    const agendamentosCol = app.findCollectionByNameOrId('agendamentos')

    const collection = new Collection({
      name: 'avaliacoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule:
        "@request.auth.id != '' && avaliador_id = @request.auth.id && (agendamento_id.estudante_id = @request.auth.id || agendamento_id.monitor_id = @request.auth.id)",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'agendamento_id',
          type: 'relation',
          required: true,
          collectionId: agendamentosCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'avaliador_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'avaliado_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nota', type: 'number', required: true, min: 1, max: 5 },
        { name: 'comentario', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('avaliacoes')
    app.delete(collection)
  },
)
