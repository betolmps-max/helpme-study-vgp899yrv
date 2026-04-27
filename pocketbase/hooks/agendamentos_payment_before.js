onRecordCreate((e) => {
  const monitorId = e.record.get('monitor_id')
  const estudanteId = e.record.get('estudante_id')

  try {
    const monitorProfile = $app.findFirstRecordByData('profiles', 'user_id', monitorId)
    const valorSessao = monitorProfile.getFloat('valor_sessao') || 0

    e.record.set('valor_pago', valorSessao)

    if (valorSessao > 0) {
      const estudante = $app.findRecordById('users', estudanteId)
      const saldo = estudante.getFloat('saldo') || 0
      if (saldo < valorSessao) {
        throw new BadRequestError('Saldo insuficiente para este agendamento.')
      }
    }
  } catch (err) {
    if (err.status) throw err
  }
  e.next()
}, 'agendamentos')
