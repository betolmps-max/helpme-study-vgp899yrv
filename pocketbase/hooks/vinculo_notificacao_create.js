onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const dependenteId = record.getString('dependente_id')
  const responsavelId = record.getString('responsavel_id')

  if (dependenteId) {
    try {
      const responsavel = $app.findRecordById('_pb_users_auth_', responsavelId)
      const resendApiKey = $secrets.get('RESEND_API_KEY')
      if (resendApiKey) {
        $http.send({
          url: 'https://api.resend.com/emails',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Helpme Study <onboarding@resend.dev>',
            to: record.getString('email_dependente'),
            subject: 'Solicitação de Vínculo de Responsável',
            html: `<p>Olá!</p><p>O usuário <strong>${responsavel.getString('name')}</strong> solicitou vincular sua conta à dele no Helpme Study para acompanhar suas atividades educacionais.</p><p><a href="https://pagina-de-autenticacao-37d03.goskip.app/home">Acesse seu painel</a> para aceitar ou recusar esta solicitação.</p>`,
          }),
          timeout: 15,
        })
      }
    } catch (err) {
      console.log('Error sending email in vinculo_notificacao_create', err)
    }
  }
  e.next()
}, 'responsabilidade_vinculos')
