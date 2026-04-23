migrate((app) => {
  const users = app.findCollectionByNameOrId('users')
  const userTypeField = users.fields.getByName('user_type')
  if (!userTypeField.values.includes('lider_escolar')) {
    userTypeField.values.push('lider_escolar')
  }
  app.save(users)
})
