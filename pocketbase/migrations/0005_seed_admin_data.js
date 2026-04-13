migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // 1. Seed Admin User
    let admin
    try {
      admin = app.findAuthRecordByEmail('users', 'betolmps@gmail.com')
    } catch (_) {
      admin = new Record(users)
      admin.setEmail('betolmps@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Admin Helpme')
      admin.set('user_type', 'professor')
    }
    admin.set('is_admin', true)
    app.save(admin)

    // 2. Seed a test student user for appointments statistics
    let student
    try {
      student = app.findAuthRecordByEmail('users', 'student@example.com')
    } catch (_) {
      student = new Record(users)
      student.setEmail('student@example.com')
      student.setPassword('Skip@Pass')
      student.setVerified(true)
      student.set('name', 'Test Student')
      student.set('user_type', 'student')
      app.save(student)
    }

    // 3. Seed some dummy appointments to show on admin dashboard
    try {
      app.findFirstRecordByData('appointments', 'status', 'pending')
    } catch (_) {
      const appointments = app.findCollectionByNameOrId('appointments')

      const appt1 = new Record(appointments)
      appt1.set('student_id', student.id)
      appt1.set('provider_id', admin.id)
      appt1.set('scheduled_at', new Date().toISOString().replace('T', ' '))
      appt1.set('status', 'pending')
      app.save(appt1)

      const appt2 = new Record(appointments)
      appt2.set('student_id', student.id)
      appt2.set('provider_id', admin.id)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      appt2.set('scheduled_at', tomorrow.toISOString().replace('T', ' '))
      appt2.set('status', 'confirmed')
      app.save(appt2)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('users', 'betolmps@gmail.com')
      admin.set('is_admin', false)
      app.save(admin)
    } catch (_) {}
  },
)
