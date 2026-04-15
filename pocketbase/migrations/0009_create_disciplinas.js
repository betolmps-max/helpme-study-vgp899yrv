migrate(
  (app) => {
    const collection = new Collection({
      name: 'disciplinas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: '@request.auth.is_admin = true',
      deleteRule: '@request.auth.is_admin = true',
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_disciplinas_nome ON disciplinas (nome)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('disciplinas')
    app.delete(collection)
  },
)
