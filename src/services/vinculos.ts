import pb from '@/lib/pocketbase/client'

export const getVinculosResponsavel = (responsavelId: string) =>
  pb.collection('responsabilidade_vinculos').getFullList({
    filter: `responsavel_id = "${responsavelId}"`,
    sort: '-created',
  })

export const getVinculosDependente = (dependenteId: string) =>
  pb.collection('responsabilidade_vinculos').getFullList({
    filter: `dependente_id = "${dependenteId}" && status = "pendente"`,
    expand: 'responsavel_id',
    sort: '-created',
  })

export const createVinculo = (data: {
  responsavel_id: string
  email_dependente: string
  status: 'pendente'
}) => pb.collection('responsabilidade_vinculos').create(data)

export const updateVinculoStatus = (id: string, status: 'aceito' | 'recusado') =>
  pb.collection('responsabilidade_vinculos').update(id, { status })
