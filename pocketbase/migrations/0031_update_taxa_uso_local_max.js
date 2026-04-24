migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    const field = col.fields.getByName('taxa_uso_local')
    if (field) {
      field.min = 0
      field.max = 5
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    const field = col.fields.getByName('taxa_uso_local')
    if (field) {
      field.min = null
      field.max = null
    }
    app.save(col)
  },
)
