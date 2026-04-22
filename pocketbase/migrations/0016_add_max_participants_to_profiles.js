migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    if (!col.fields.getByName('max_participants')) {
      col.fields.add(new NumberField({ name: 'max_participants', min: 1, max: 10 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    col.fields.removeByName('max_participants')
    app.save(col)
  },
)
