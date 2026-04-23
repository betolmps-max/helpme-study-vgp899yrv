migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_')
  try {
    app.findAuthRecordByEmail('users', 'lider@example.com')
    return
  } catch (_) {}

  const record = new Record(users)
  record.setEmail('lider@example.com')
  record.setPassword('Skip@Pass')
  record.setVerified(true)
  record.set('name', 'Líder Escolar')
  record.set('user_type', 'lider_escolar')
  app.save(record)
})
