onRecordAfterCreateSuccess((e) => {
  const avaliadoId = e.record.getString('avaliado_id')
  if (!avaliadoId) return e.next()

  const user = $app.findRecordById('users', avaliadoId)

  const total = user.getInt('total_avaliacoes') || 0
  const media = user.getFloat('media_avaliacao') || 0
  const nota = e.record.getInt('nota')

  const newTotal = total + 1
  const newMedia = (media * total + nota) / newTotal

  user.set('total_avaliacoes', newTotal)
  user.set('media_avaliacao', newMedia)

  $app.save(user)

  return e.next()
}, 'avaliacoes')
