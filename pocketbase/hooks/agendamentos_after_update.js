onRecordAfterUpdateSuccess((e) => {
  const apiKey = $secrets.get('RESEND_API_KEY')
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email notification.')
    return e.next()
  }

  try {
    const record = e.record
    const original = record.original()

    const oldStatus = original ? original.getString('status') : ''
    const newStatus = record.getString('status')

    if (oldStatus === newStatus) {
      return e.next()
    }

    const estudanteId = record.get('estudante_id')
    const monitorId = record.get('monitor_id')

    if (!estudanteId || !monitorId) return e.next()

    const student = $app.findRecordById('users', estudanteId)
    const monitor = $app.findRecordById('users', monitorId)

    const studentEmail = student.getString('email')
    const monitorEmail = monitor.getString('email')
    const studentName = student.getString('name') || 'Estudante'
    const monitorName = monitor.getString('name') || 'Monitor'

    const assunto = record.getString('assunto')
    const dataAgendamento = record.getString('data_agendamento').substring(0, 10)
    const horarioInicio = record.getString('horario_inicio') || 'Horário não definido'
    const local = record.getString('local') || 'A definir'

    if (oldStatus === 'pendente' && newStatus === 'confirmado') {
      const html = `
        <h2>Agendamento Confirmado!</h2>
        <p>Olá ${studentName},</p>
        <p>Seu agendamento com <strong>${monitorName}</strong> foi confirmado.</p>
        <ul>
          <li><strong>Assunto:</strong> ${assunto}</li>
          <li><strong>Data:</strong> ${dataAgendamento}</li>
          <li><strong>Horário:</strong> ${horarioInicio}</li>
          <li><strong>Local:</strong> ${local}</li>
        </ul>
        <p>Bons estudos!</p>
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
          to: [studentEmail],
          subject: 'Agendamento Confirmado - Helpme Study',
          html: html,
        }),
        timeout: 15,
      })

      if (res.statusCode !== 200) {
        console.log('Failed to send confirmation email', res.raw)
      }
    } else if (newStatus === 'cancelado') {
      const html = `
        <h2>Agendamento Cancelado</h2>
        <p>O agendamento sobre <strong>${assunto}</strong> do dia ${dataAgendamento} às ${horarioInicio} foi cancelado.</p>
        <p>Acesse a plataforma Helpme Study para mais detalhes ou para agendar um novo horário.</p>
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
          to: [studentEmail, monitorEmail],
          subject: 'Agendamento Cancelado - Helpme Study',
          html: html,
        }),
        timeout: 15,
      })

      if (res.statusCode !== 200) {
        console.log('Failed to send cancellation email', res.raw)
      }
    }
  } catch (err) {
    console.log('Error processing agendamentos_after_update hook:', err)
  }

  return e.next()
}, 'agendamentos')
