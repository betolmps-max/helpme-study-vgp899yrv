migrate(
  (app) => {
    let adminUser
    try {
      // Attempt to find the requested admin
      adminUser = app.findAuthRecordByEmail('users', 'coordenacaoiberao@gmai.com')
    } catch (_) {
      // If it doesn't exist, create it to fulfill the seed requirement
      const usersCol = app.findCollectionByNameOrId('users')
      adminUser = new Record(usersCol)
      adminUser.setEmail('coordenacaoiberao@gmai.com')
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Coordenação Iberão')
      adminUser.set('user_type', 'professor')
      adminUser.set('is_admin', true)
      app.save(adminUser)
    }

    // Find other available users for students and monitors
    const allUsers = app.findRecordsByFilter('users', '1=1', '-created', 10, 0)
    let studentUser = allUsers.find((u) => u.get('user_type') === 'student') || adminUser
    let monitorUser = allUsers.find((u) => u.get('user_type') === 'monitor') || adminUser

    const agendamentos = app.findCollectionByNameOrId('agendamentos')

    const seeds = [
      {
        estudante_id: studentUser.id,
        monitor_id: adminUser.id, // Linking to the admin as requested
        assunto: 'Revisão de Biologia',
        data_agendamento: '2026-06-10 14:00:00.000Z',
        horario_inicio: '14:00',
        horario_fim: '15:00',
        local: 'Sala 101',
        status: 'confirmado',
      },
      {
        estudante_id: studentUser.id,
        monitor_id: monitorUser.id,
        assunto: 'Dúvidas em Química',
        data_agendamento: '2026-06-11 10:00:00.000Z',
        horario_inicio: '10:00',
        horario_fim: '11:00',
        local: 'Laboratório 3',
        status: 'pendente',
      },
      {
        estudante_id: monitorUser.id,
        monitor_id: adminUser.id, // Linking to the admin as requested
        assunto: 'Reunião de Acompanhamento',
        data_agendamento: '2026-06-12 16:00:00.000Z',
        horario_inicio: '16:00',
        horario_fim: '17:00',
        local: 'Online (Google Meet)',
        status: 'cancelado',
      },
    ]

    for (const seed of seeds) {
      try {
        // Make it idempotent by checking if it already exists
        app.findFirstRecordByData('agendamentos', 'assunto', seed.assunto)
      } catch (_) {
        const record = new Record(agendamentos)
        for (const [key, value] of Object.entries(seed)) {
          record.set(key, value)
        }
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'agendamentos',
        "assunto ~ 'Revisão de Biologia' || assunto ~ 'Dúvidas em Química' || assunto ~ 'Reunião de Acompanhamento'",
        '',
        10,
        0,
      )
      for (const record of records) {
        app.delete(record)
      }
    } catch (_) {}
  },
)
