import pb from '@/lib/pocketbase/client'

export const getMeusFavoritos = (userId: string) =>
  pb.collection('favoritos_locais').getFullList({ filter: `user_id="${userId}"` })

export const toggleFavorito = async (userId: string, localId: string) => {
  try {
    const existing = await pb
      .collection('favoritos_locais')
      .getFirstListItem(`user_id="${userId}" && local_id="${localId}"`)
    await pb.collection('favoritos_locais').delete(existing.id)
    return false
  } catch (_) {
    await pb.collection('favoritos_locais').create({ user_id: userId, local_id: localId })
    return true
  }
}
