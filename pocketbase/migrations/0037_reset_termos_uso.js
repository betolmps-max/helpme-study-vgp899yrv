migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('termos_uso')
    app.truncateCollection(collection)

    collection.fields.removeByName('conteudo')
    app.save(collection)

    const col2 = app.findCollectionByNameOrId('termos_uso')
    col2.fields.add(
      new TextField({
        name: 'conteudo',
        required: true,
        max: 200000,
      }),
    )
    app.save(col2)

    const col3 = app.findCollectionByNameOrId('termos_uso')
    const record = new Record(col3)
    const conteudo = `TERMOS DE USO E POLÍTICA DE PRIVACIDADE

Bem-vindo(a) ao Help Me Study! Leia atentamente os termos abaixo antes de continuar a utilizar a nossa plataforma.

1. ACEITAÇÃO DOS TERMOS
Ao acessar, navegar e utilizar a plataforma Help Me Study, você concorda expressa e integralmente com todos os termos, condições e diretrizes aqui estabelecidos. Caso não concorde com qualquer disposição, você não deve acessar ou utilizar nossos serviços. O uso continuado após quaisquer alterações significará a sua aceitação das novas condições.

2. OBJETIVO E NATUREZA DA PLATAFORMA
O Help Me Study foi criado com o propósito de conectar estudantes que buscam reforço acadêmico a monitores, professores ou voluntários dispostos a compartilhar conhecimento. Atuamos como intermediadores, facilitando o agendamento, a comunicação e a organização das sessões de estudo.

3. REQUISITOS DE CADASTRO E RESPONSABILIDADES DO USUÁRIO
3.1. O usuário compromete-se a fornecer informações verdadeiras, exatas, atuais e completas durante o processo de registro.
3.2. É estritamente proibida a criação de perfis falsos (fakes) ou a utilização da conta por terceiros. A conta é pessoal e intransferível.
3.3. O usuário é o único responsável por manter a segurança e o sigilo de suas senhas de acesso. Qualquer atividade realizada sob sua conta será presumida como feita por você.
3.4. Em caso de perda, roubo ou suspeita de uso não autorizado da conta, o usuário deve notificar imediatamente a administração da plataforma.

4. POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
4.1. Em conformidade com a legislação de proteção de dados, coletamos informações básicas, como nome, e-mail, instituição de ensino e histórico de agendamentos, apenas para viabilizar o funcionamento essencial do serviço.
4.2. Comprometemo-nos a proteger sua privacidade. Seus dados não serão comercializados, alugados ou repassados a terceiros não autorizados para fins de marketing.
4.3. O usuário tem o direito de solicitar a visualização, alteração ou exclusão definitiva da sua conta e de seus dados pessoais a qualquer momento, através das configurações do perfil ou contatando o suporte.

5. AGENDAMENTOS, PAGAMENTOS E SISTEMA DE "HELPS"
5.1. As sessões de monitoria podem ser gratuitas ou pagas, utilizando "Helps" (a moeda virtual interna) ou valores em moeda corrente, dependendo da configuração estabelecida pelo monitor.
5.2. O cancelamento de um agendamento deve seguir as regras de antecedência mínima estipuladas na plataforma para evitar penalidades na reputação ou perdas financeiras/de saldo.
5.3. O Help Me Study não atua como instituição financeira, e o saldo de "Helps" não possui valor monetário conversível para saque fora das regras específicas de recompensas (quando aplicável).

6. CÓDIGO DE CONDUTA E REGRAS DE CONVIVÊNCIA
Esperamos que todos os membros mantenham um ambiente acadêmico, amigável e de respeito mútuo. São expressamente proibidos:
6.1. Qualquer forma de assédio, discriminação, bullying, discursos de ódio, intimidação ou ofensas contra outros usuários.
6.2. A utilização da plataforma para promoção comercial não autorizada, envio de spam, correntes ou esquemas de pirâmide.
6.3. O compartilhamento, envio ou solicitação de conteúdo pornográfico, ilegal ou que viole direitos autorais e de propriedade intelectual de terceiros (ex: compartilhamento ilegal de materiais didáticos pagos).
6.4. A tentativa de fraude no sistema de avaliações ou no acúmulo de saldo ("Helps").

7. AVALIAÇÕES E REPUTAÇÃO
7.1. Após a conclusão de uma sessão de estudo, as partes envolvidas poderão avaliar a experiência.
7.2. As avaliações devem ser justas, objetivas e baseadas na realidade da sessão. Avaliações contendo xingamentos ou difamação poderão ser removidas pela moderação.

8. LIMITAÇÃO DE RESPONSABILIDADE E INDENIZAÇÃO
8.1. O Help Me Study não se responsabiliza pelo conteúdo efetivamente ensinado nas sessões, pela exatidão das informações trocadas ou pelo desempenho acadêmico final dos estudantes.
8.2. Qualquer conflito, desacordo ou disputa entre alunos e monitores deve ser resolvido amigavelmente entre as partes. A plataforma poderá, a seu exclusivo critério, intervir em casos de grave violação das regras, podendo suspender ou banir os envolvidos.
8.3. O serviço é fornecido "no estado em que se encontra", não garantindo que a plataforma estará livre de erros, interrupções temporárias ou falhas técnicas.

9. SUSPENSÃO E CANCELAMENTO DE CONTAS
A administração do Help Me Study reserva-se o direito de suspender ou banir definitivamente, sem aviso prévio, contas de usuários que violarem repetidamente ou de forma grave qualquer cláusula deste documento.

10. ATUALIZAÇÃO E MODIFICAÇÃO DESTES TERMOS
A plataforma poderá revisar, alterar ou atualizar estes Termos de Uso e a Política de Privacidade periodicamente para refletir melhorias no sistema ou exigências legais. Notificaremos os usuários sobre mudanças significativas, e um novo aceite formal será exigido na tela inicial para continuar acessando o sistema.

11. DISPOSIÇÕES FINAIS E FORO
Caso qualquer disposição destes termos seja considerada nula ou inexequível, as demais continuarão em pleno vigor. Fica eleito o foro da comarca da sede da empresa administradora da plataforma para dirimir quaisquer dúvidas ou controvérsias oriundas deste documento.

DECLARAÇÃO DE CONSENTIMENTO:
Ao rolar a página até o final deste documento e clicar no botão "Li e Aceito", você declara que leu na íntegra, compreendeu perfeitamente e concorda de forma irrevogável com todas as regras, responsabilidades e políticas estabelecidas acima.`

    record.set('conteudo', conteudo)
    app.save(record)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('termos_uso')
    app.truncateCollection(collection)
  },
)
