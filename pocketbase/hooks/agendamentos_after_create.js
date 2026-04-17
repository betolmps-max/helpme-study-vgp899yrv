onRecordAfterCreateSuccess((e) => {
  const apiKey = $secrets.get('RESEND_API_KEY')
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email notification.')
    return e.next()
  }

  try {
    const record = e.record
    const estudanteId = record.get('estudante_id')
    const monitorId = record.get('monitor_id')

    if (!estudanteId || !monitorId) return e.next()

    const student = $app.findRecordById('users', estudanteId)
    const monitor = $app.findRecordById('users', monitorId)

    const monitorEmail = monitor.getString('email')
    const studentName = student.getString('name') || 'Um estudante'
    const assunto = record.getString('assunto')
    const dataAgendamento = record.getString('data_agendamento').substring(0, 10)
    const horarioInicio = record.getString('horario_inicio') || 'Horário não definido'

    const html = `
      <h2>Novo Agendamento Solicitado</h2>
      <p>Olá ${monitor.getString('name') || 'Monitor'},</p>
      <p><strong>${studentName}</strong> solicitou um novo agendamento com você.</p>
      <ul>
        <li><strong>Assunto:</strong> ${assunto}</li>
        <li><strong>Data:</strong> ${dataAgendamento}</li>
        <li><strong>Horário de Início:</strong> ${horarioInicio}</li>
      </ul>
      <p>Acesse a plataforma Helpme Study para confirmar ou cancelar esta solicitação.</p>
    `

    const res = $http.send({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        from: 'Helpme Study <onboarding@resend.dev>',
        to: [monitorEmail],
        subject: 'Novo Agendamento Solicitado - Helpme Study',
        html: html,
      }),
      timeout: 15,
    })

    if (res.statusCode !== 200) {
      console.log('Failed to send creation email', res.raw)
    }
  } catch (err) {
    console.log('Error processing agendamentos_after_create hook:', err)
  }

  return e.next()
}, 'agendamentos')
