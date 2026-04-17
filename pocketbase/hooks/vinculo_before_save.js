onRecordValidate((e) => {
  const email = e.record.getString('email_dependente')
  if (email && !e.record.getString('dependente_id')) {
    try {
      const user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
      e.record.set('dependente_id', user.id)
    } catch (_) {}
  }
  e.next()
}, 'responsabilidade_vinculos')
