onRecordAfterCreateSuccess((e) => {
  const remetenteId = e.record.getString('remetente_id')
  const conversaId = e.record.getString('conversa_id')
  const conteudo = e.record.getString('conteudo')

  const conversa = $app.findRecordById('conversas', conversaId)
  const participantes = conversa.getStringSlice('participantes')

  const remetente = $app.findRecordById('users', remetenteId)
  const remetenteNome = remetente.getString('name') || 'Um usuário'

  for (const pId of participantes) {
    if (pId === remetenteId) continue

    try {
      const user = $app.findRecordById('users', pId)

      // Checa a preferência do usuário. Se explicitamente desativado, pula.
      // Se for undefined (usuário antigo sem o campo), assume true conforme a migração padrão.
      if (user.getBool('notificacoes_email') === false) continue

      const email = user.getString('email')
      if (!email) continue

      const resendKey = $secrets.get('RESEND_API_KEY')

      if (resendKey) {
        $http.send({
          url: 'https://api.resend.com/emails',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + resendKey,
          },
          body: JSON.stringify({
            from: 'Help Me Study <noreply@usecurling.com>',
            to: email,
            subject: `Nova mensagem de ${remetenteNome}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Você recebeu uma nova mensagem no Help Me Study</h2>
                <div style="padding: 15px; background: #f4f4f5; border-left: 4px solid #6366f1; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 16px;"><strong>${remetenteNome}:</strong> ${conteudo}</p>
                </div>
                <p>
                  <a href="https://pagina-de-autenticacao-37d03.goskip.app/chat" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
                    Acessar o Chat
                  </a>
                </p>
                <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                  Você pode desativar essas notificações em seu perfil.
                </p>
              </div>
            `,
          }),
        })
      } else {
        console.log(
          `[MOCK EMAIL] To: ${email} | Subject: Nova mensagem de ${remetenteNome} | Body: ${conteudo}`,
        )
      }
    } catch (err) {
      console.log('Erro ao processar notificação de chat para participante: ' + pId, err)
    }
  }

  e.next()
}, 'mensagens')
