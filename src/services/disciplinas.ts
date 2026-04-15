import pb from '@/lib/pocketbase/client'

export interface Disciplina {
  id: string
  nome: string
  created: string
  updated: string
}

export const getDisciplinas = () =>
  pb.collection('disciplinas').getFullList<Disciplina>({ sort: 'nome' })
export const createDisciplina = (nome: string) =>
  pb.collection('disciplinas').create<Disciplina>({ nome })
