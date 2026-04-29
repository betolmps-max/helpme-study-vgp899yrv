migrate(
  (app) => {
    let col = app.findCollectionByNameOrId('termos_uso')

    // Re-create 'conteudo' field to bump the max constraint up to 20000 characters
    const oldField = col.fields.getByName('conteudo')
    if (oldField) {
      col.fields.removeByName('conteudo')
      col.fields.add(
        new TextField({
          name: 'conteudo',
          required: true,
          max: 20000,
        }),
      )
      app.save(col)
    }

    // Re-fetch the collection to ensure the new schema constraints are applied when creating records
    col = app.findCollectionByNameOrId('termos_uso')

    // Delete previous records to keep only the latest terms
    app.db().newQuery('DELETE FROM termos_uso').execute()

    const record = new Record(col)
    record.set(
      'conteudo',
      `**HELP ME STUDY!**
**TERMOS DE USO E POLÍTICA DE PRIVACIDADE**
*Regulamento Geral de Utilização, Conduta e Proteção de Dados Pessoais*
*28 de abril de 2026*

**1. TERMOS DE USO**
Estes Termos de Uso regulam a utilização do aplicativo HELP ME STUDY!, plataforma destinada à intermediação entre estudantes e monitores para a realização de atividades de apoio pedagógico em locais físicos e horários de conveniência mútua.

**1.1. Definições e Escopo**
Para fins deste contrato, considera-se PLATAFORMA o aplicativo HELP ME STUDY!; ESTUDANTE o usuário que busca auxílio acadêmico; MONITOR o usuário que oferece serviços de monitoria; e USUÁRIO qualquer pessoa cadastrada no sistema. A PLATAFORMA atua exclusivamente como INTERMEDIÁRIA, não possuindo vínculo empregatício com os monitores nem responsabilidade técnica pelo conteúdo pedagógico ministrado.

**1.2. Elegibilidade e Registro de Usuários**
A utilização da PLATAFORMA é permitida a pessoas físicas plenamente capazes. MENORES DE 18 ANOS deverão obrigatoriamente realizar o cadastro sob supervisão e com o consentimento expresso de seus pais ou representantes legais, que responderão solidariamente por todos os atos praticados pelo menor na PLATAFORMA.

**1.3. Responsabilidades do Usuário**
O USUÁRIO compromete-se a fornecer informações verídicas e manter seus dados atualizados. É responsabilidade exclusiva do USUÁRIO a escolha do local para os encontros presenciais, recomendando-se fortemente a utilização de LOCAIS PÚBLICOS e movimentados (bibliotecas, cafés, centros culturais) para garantir a segurança pessoal.

**1.4. Proibições e Condutas Inadequadas**
É terminantemente proibido o uso da PLATAFORMA para fins não educacionais. São condutas passíveis de banimento imediato:
1. Prática de assédio, discriminação, bullying ou linguagem ofensiva.
2. Tentativa de fraude, compartilhamento de material ilícito ou plágio acadêmico.
3. Uso da ferramenta para agendamento de encontros de natureza pessoal ou romântica.
4. Divulgação de dados de contato (telefone, e-mail) antes da confirmação formal do agendamento via app.

**1.5. Direitos de Propriedade Intelectual**
Todos os direitos sobre a marca HELP ME STUDY!, logotipos, mascotes, interface e códigos-fonte pertencem exclusivamente aos seus desenvolvedores. O uso do app não concede ao USUÁRIO qualquer direito de exploração comercial da marca.

**1.6. Limitação de Responsabilidade**
A PLATAFORMA não se responsabiliza por: (i) danos decorrentes de encontros presenciais; (ii) qualidade técnica ou pedagógica das monitorias; (iii) furtos, roubos ou incidentes ocorridos nos locais escolhidos pelos usuários; (iv) falhas de conexão ou indisponibilidade temporária do sistema.

**1.7. Indenização**
O USUÁRIO concorda em indenizar e isentar a PLATAFORMA de quaisquer reclamações, perdas ou danos causados por sua conduta inadequada ou violação destes termos.

**1.8. Rescisão de Conta**
A PLATAFORMA reserva-se o direito de suspender ou encerrar contas que violem as diretrizes de segurança ou ética, sem necessidade de aviso prévio, especialmente em casos de denúncias de ASSÉDIO ou FRAUDE.

**1.9. Modificações dos Termos**
Estes termos podem ser atualizados periodicamente. O uso continuado do aplicativo após a publicação de alterações constitui aceitação dos novos termos.

**1.10. Disposições Gerais**
Qualquer omissão destes termos não implica em renúncia de direitos. Fica eleito o foro da comarca de domicílio da sede da PLATAFORMA para dirimir quaisquer controvérsias.

**2. POLÍTICA DE PRIVACIDADE**
Esta política descreve como o HELP ME STUDY! coleta, utiliza e protege seus dados, em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

**2.1. Informações que Coletamos**
Coletamos dados necessários para a operação: nome completo, CPF (para validação de identidade), e-mail, telefone, instituição de ensino, geolocalização (para sugerir locais próximos) e histórico de monitorias.

**2.2. Como Usamos as Informações**
Os dados são utilizados para: (i) viabilizar o "match" entre estudante e monitor; (ii) garantir a segurança através da verificação de perfis; (iii) processar pagamentos (se aplicável); e (iv) enviar notificações sobre agendamentos.

**2.3. Compartilhamento de Dados**
A PLATAFORMA compartilha apenas os dados estritamente necessários entre as partes (ex: nome e foto do monitor para o estudante) após a confirmação do agendamento. NÃO VENDEMOS dados para terceiros.

**2.4. Segurança dos Dados**
Utilizamos criptografia de ponta a ponta e servidores seguros para proteger suas informações contra acessos não autorizados e incidentes de segurança.

**2.5. Retenção de Dados**
Os dados são mantidos enquanto a conta estiver ativa. Após a solicitação de exclusão, os dados serão deletados, exceto aqueles que a lei exige que sejam mantidos para fins fiscais ou judiciais.

**2.6. Direitos do Usuário (LGPD)**
O USUÁRIO tem direito a: (i) confirmar a existência de tratamento; (ii) acessar seus dados; (iii) corrigir dados incompletos; (iv) solicitar a anonimização ou eliminação de dados desnecessários.

**2.7. Cookies e Tecnologias de Rastreamento**
Utilizamos cookies para melhorar a experiência de navegação e lembrar preferências de horários e locais de estudo.

**2.8. Dados de Menores de Idade**
O tratamento de dados de menores de idade é realizado com o consentimento dos responsáveis. Implementamos camadas extras de verificação para perfis de menores, visando sua proteção integral.

**2.9. Conformidade com Leis**
Esta política é regida pelas leis da República Federativa do Brasil. Colaboramos com autoridades judiciais mediante ordens legais específicas.

**2.10. Contato e Reclamações**
Para exercer seus direitos ou realizar denúncias de conduta, o USUÁRIO deve entrar em contato através do e-mail: suporte@helpmestudy.app.

*Atenção: Ao utilizar o HELP ME STUDY!, você declara estar ciente de que a plataforma é uma ferramenta de facilitação e que a segurança pessoal em encontros físicos é de responsabilidade compartilhada entre os usuários, devendo sempre priorizar locais públicos.*

*Documento atualizado em 28 de abril de 2026.*
*HELP ME STUDY! - Tecnologia para Educação*`,
    )
    app.save(record)
  },
  (app) => {
    app.db().newQuery('DELETE FROM termos_uso').execute()
  },
)
