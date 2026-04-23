migrate(
  (app) => {
    const collection = new Collection({
      name: 'transacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'agendamento_id',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('agendamentos').id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'deposito',
            'pagamento_sessao',
            'recebimento_sessao',
            'estorno',
            'resgate',
            'gorjeta',
          ],
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'concluido', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('transacoes'))
  },
)
