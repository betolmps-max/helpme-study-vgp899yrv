migrate(
  (app) => {
    const collection = new Collection({
      name: 'solicitacoes_resgate',
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
        { name: 'valor', type: 'number', required: true, min: 1 },
        { name: 'detalhes_pagamento', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'processado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('solicitacoes_resgate'))
  },
)
