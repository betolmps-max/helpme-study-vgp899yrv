migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      name: 'agendamentos',
      type: 'base',
      listRule:
        '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id',
      viewRule:
        '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule:
        '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id',
      deleteRule: '@request.auth.is_admin = true',
      fields: [
        {
          name: 'estudante_id',
          type: 'relation',
          required: true,
          collectionId: usersCollection.id,
          maxSelect: 1,
        },
        {
          name: 'monitor_id',
          type: 'relation',
          required: true,
          collectionId: usersCollection.id,
          maxSelect: 1,
        },
        { name: 'assunto', type: 'text', required: true },
        { name: 'data_agendamento', type: 'date', required: true },
        { name: 'horario_inicio', type: 'text' },
        { name: 'horario_fim', type: 'text' },
        { name: 'local', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'confirmado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_agendamentos_data ON agendamentos (data_agendamento)',
        'CREATE INDEX idx_agendamentos_status ON agendamentos (status)',
        'CREATE INDEX idx_agendamentos_estudante ON agendamentos (estudante_id)',
        'CREATE INDEX idx_agendamentos_monitor ON agendamentos (monitor_id)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('agendamentos')
    app.delete(collection)
  },
)
