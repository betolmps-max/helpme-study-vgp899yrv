onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  const status = record.getString('status')
  const oldStatus = original.getString('status')

  if (status !== oldStatus && (status === 'aceito' || status === 'recusado')) {
    try {
      const responsavelId = record.getString('responsavel_id')
      const responsavel = $app.findRecordById('_pb_users_auth_', responsavelId)

      const dependenteId = record.getString('dependente_id')
      let dependenteName = 'O dependente'
      if (dependenteId) {
        try {
          const dependente = $app.findRecordById('_pb_users_auth_', dependenteId)
          const name = dependente.getString('name')
          if (name) dependenteName = name
        } catch (_) {}
      }

      const resendApiKey = $secrets.get('RESEND_API_KEY')
      if (resendApiKey && responsavel.getString('email')) {
        $http.send({
          url: 'https://api.resend.com/emails',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Helpme Study <onboarding@resend.dev>',
            to: responsavel.getString('email'),
            subject: `Atualização no Vínculo: ${status.toUpperCase()}`,
            html: `<p>Olá ${responsavel.getString('name')},</p><p>Sua solicitação de vínculo para o email <strong>${record.getString('email_dependente')}</strong> foi <strong>${status}</strong> por ${dependenteName}.</p>`,
          }),
          timeout: 15,
        })
      }
    } catch (err) {
      console.log('Error sending email in vinculo_resultado_update', err)
    }
  }
  e.next()
}, 'responsabilidade_vinculos')
