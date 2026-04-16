migrate(
  (app) => {
    const locais = app.findCollectionByNameOrId('locais')

    const seedData = [
      { nome: 'Biblioteca Central', endereco: 'Campus Principal, Prédio 1' },
      { nome: 'Laboratório de Informática', endereco: 'Bloco C, Sala 102' },
      { nome: 'Sala de Estudos - Bloco A', endereco: 'Bloco A, Térreo' },
    ]

    for (const data of seedData) {
      try {
        app.findFirstRecordByData('locais', 'nome', data.nome)
      } catch (_) {
        const record = new Record(locais)
        record.set('nome', data.nome)
        record.set('endereco', data.endereco)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const locais = app.findCollectionByNameOrId('locais')
      app.truncateCollection(locais)
    } catch (_) {}
  },
)
