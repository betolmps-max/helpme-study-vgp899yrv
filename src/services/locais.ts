import pb from '@/lib/pocketbase/client'

export const getLocaisList = () => pb.collection('locais').getFullList({ sort: '-created' })
export const getLocaisPorLider = (liderId: string) =>
  pb.collection('locais').getFullList({ filter: `lider_id = "${liderId}"`, sort: '-created' })
export const createLocal = (data: { nome: string; endereco?: string; lider_id?: string }) =>
  pb.collection('locais').create(data)
export const updateLocal = (id: string, data: Partial<{ nome: string; endereco: string }>) =>
  pb.collection('locais').update(id, data)
export const deleteLocal = (id: string) => pb.collection('locais').delete(id)
