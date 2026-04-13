migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const email = 'coordenacaoiberao@gmai.com'

    try {
      const record = app.findAuthRecordByEmail('users', email)
      record.set('is_admin', true)
      app.save(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail(email)
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Coordenacao Admin')
      record.set('user_type', 'professor')
      record.set('is_admin', true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'coordenacaoiberao@gmai.com')
      record.set('is_admin', false)
      app.save(record)
    } catch (_) {}
  },
)
