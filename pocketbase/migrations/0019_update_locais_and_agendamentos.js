migrate((app) => {
  const locais = app.findCollectionByNameOrId('locais')

  if (!locais.fields.getByName('lider_id')) {
    locais.fields.add(
      new RelationField({
        name: 'lider_id',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
  }

  locais.listRule = "@request.auth.id != ''"
  locais.viewRule = "@request.auth.id != ''"
  locais.createRule = "@request.auth.user_type = 'lider_escolar' || @request.auth.is_admin = true"
  locais.updateRule = 'lider_id = @request.auth.id || @request.auth.is_admin = true'
  locais.deleteRule = 'lider_id = @request.auth.id || @request.auth.is_admin = true'
  app.save(locais)

  const agendamentos = app.findCollectionByNameOrId('agendamentos')

  if (!agendamentos.fields.getByName('local_id')) {
    agendamentos.fields.add(
      new RelationField({
        name: 'local_id',
        collectionId: locais.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
  }

  agendamentos.listRule =
    '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id'
  agendamentos.viewRule =
    '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id'
  agendamentos.updateRule =
    '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id'
  app.save(agendamentos)
})
