migrate(
  (app) => {
    const collection = new Collection({
      name: 'responsabilidade_vinculos',
      type: 'base',
      listRule: '@request.auth.id = responsavel_id || @request.auth.id = dependente_id',
      viewRule: '@request.auth.id = responsavel_id || @request.auth.id = dependente_id',
      createRule: "@request.auth.id != '' && @request.auth.user_type = 'responsavel'",
      updateRule: '@request.auth.id = dependente_id',
      deleteRule: null,
      fields: [
        {
          name: 'responsavel_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'dependente_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'email_dependente', type: 'email', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aceito', 'recusado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('responsabilidade_vinculos')
    app.delete(collection)
  },
)
