migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agendamentos')
    col.listRule =
      '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id || estudante_id.responsabilidade_vinculos_via_dependente_id.responsavel_id ?= @request.auth.id || local_id.favoritos_locais_via_local_id.user_id ?= @request.auth.id'
    col.viewRule =
      '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id || estudante_id.responsabilidade_vinculos_via_dependente_id.responsavel_id ?= @request.auth.id || local_id.favoritos_locais_via_local_id.user_id ?= @request.auth.id'
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agendamentos')
    col.listRule =
      '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id || estudante_id.responsabilidade_vinculos_via_dependente_id.responsavel_id ?= @request.auth.id'
    col.viewRule =
      '@request.auth.is_admin = true || estudante_id = @request.auth.id || monitor_id = @request.auth.id || local_id.lider_id = @request.auth.id || estudante_id.responsabilidade_vinculos_via_dependente_id.responsavel_id ?= @request.auth.id'
    app.save(col)
  },
)
