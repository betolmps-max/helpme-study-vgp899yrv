migrate(
  (app) => {
    const termos = app.findCollectionByNameOrId('termos_uso')
    const record = new Record(termos)
    record.set(
      'conteudo',
      `HELP ME STUDY! TERMOS DE USO E POLÍTICA DE PRIVACIDADE

Atualizado em: 28 de abril de 2026

Bem-vindo ao Help Me Study! Ao utilizar nossa plataforma, você concorda com os seguintes termos:

1. ACEITAÇÃO DOS TERMOS
Ao acessar e usar a plataforma Help Me Study, você concorda em cumprir e ser legalmente regido por estes Termos de Uso e Política de Privacidade.

2. DESCRIÇÃO DO SERVIÇO
O Help Me Study é uma plataforma que conecta estudantes a monitores e professores para agendamento de sessões de estudo, mentorias e aulas de reforço.

3. RESPONSABILIDADES DO USUÁRIO
- Fornecer informações verdadeiras e precisas no cadastro.
- Manter a confidencialidade de suas credenciais de acesso.
- Utilizar a plataforma de forma ética e respeitosa com os demais usuários.
- Não utilizar a plataforma para fins ilegais ou não autorizados.

4. POLÍTICA DE PAGAMENTOS E CANCELAMENTOS
- Os pagamentos pelas sessões são processados através da plataforma.
- Cancelamentos devem ser feitos com antecedência mínima de 24 horas para reembolso integral.
- O Help Me Study retém uma taxa de serviço sobre as transações realizadas.

5. POLÍTICA DE PRIVACIDADE E DADOS
- Coletamos dados pessoais (nome, email, histórico de uso) necessários para a prestação do serviço.
- Não compartilhamos seus dados com terceiros sem consentimento, exceto quando exigido por lei.
- Você pode solicitar a exclusão de sua conta e dados a qualquer momento.

6. PROPRIEDADE INTELECTUAL
Todo o conteúdo, design e marca da plataforma são de propriedade exclusiva do Help Me Study. É proibida a reprodução sem autorização.

7. MODIFICAÇÕES DOS TERMOS
Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre mudanças significativas, exigindo novo aceite se necessário.

8. CONTATO
Para dúvidas sobre estes termos, entre em contato através do nosso suporte.`,
    )
    app.save(record)
  },
  (app) => {
    const records = app.findRecordsByFilter('termos_uso', '1=1', '', 10)
    for (let r of records) {
      app.delete(r)
    }
  },
)
