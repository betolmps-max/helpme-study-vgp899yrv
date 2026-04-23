migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agendamentos')
    const statusField = col.fields.getByName('status')
    statusField.values = ['pendente', 'confirmado', 'cancelado', 'concluido']
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agendamentos')
    const statusField = col.fields.getByName('status')
    statusField.values = ['pendente', 'confirmado', 'cancelado']
    app.save(col)
  },
)
