migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    col.fields.add(
      new NumberField({
        name: 'taxa_uso_local',
        min: 0,
        max: 100,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    col.fields.removeByName('taxa_uso_local')
    app.save(col)
  },
)
