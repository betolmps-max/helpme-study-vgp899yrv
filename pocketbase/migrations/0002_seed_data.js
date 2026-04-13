migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'betolmps@gmail.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('betolmps@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Admin Skip')
    record.set('user_type', 'professor')
    app.save(record)

    const profiles = app.findCollectionByNameOrId('profiles')
    const profileRecord = new Record(profiles)
    profileRecord.set('user_id', record.id)
    profileRecord.set(
      'bio',
      'Sou um professor apaixonado por matemática. Ensino o conteúdo de forma prática e interativa.',
    )
    profileRecord.set('subjects', 'Cálculo, Álgebra Linear')
    profileRecord.set('availability', 'Segundas e Quartas, 14h-18h')
    app.save(profileRecord)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'betolmps@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
