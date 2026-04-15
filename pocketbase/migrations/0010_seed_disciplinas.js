migrate(
  (app) => {
    const disciplinas = ['Matemática', 'Física', 'Programação', 'História']
    const col = app.findCollectionByNameOrId('disciplinas')

    for (const nome of disciplinas) {
      try {
        app.findFirstRecordByData('disciplinas', 'nome', nome)
      } catch (_) {
        const record = new Record(col)
        record.set('nome', nome)
        app.save(record)
      }
    }
  },
  (app) => {
    const disciplinas = ['Matemática', 'Física', 'Programação', 'História']
    for (const nome of disciplinas) {
      try {
        const record = app.findFirstRecordByData('disciplinas', 'nome', nome)
        app.delete(record)
      } catch (_) {}
    }
  },
)
