import pb from '@/lib/pocketbase/client'

export interface Profile {
  id: string
  user_id: string
  bio?: string
  subjects?: string
  availability?: string
  max_participants?: number
  valor_sessao?: number
  taxa_uso_local?: number
  created: string
  updated: string
}

export const getProfiles = () => pb.collection('profiles').getFullList<Profile>()
export const getMentorProfiles = () =>
  pb.collection('profiles').getFullList<Profile & { expand: { user_id: any } }>({
    filter: 'user_id.user_type="monitor" || user_id.user_type="professor"',
    expand: 'user_id',
  })
export const getProfile = (id: string) => pb.collection('profiles').getOne<Profile>(id)
export const getProfileByUserId = (userId: string) =>
  pb.collection('profiles').getFirstListItem<Profile>(`user_id="${userId}"`)
export const createProfile = (data: Partial<Profile>) =>
  pb.collection('profiles').create<Profile>(data)
export const updateProfile = (id: string, data: Partial<Profile>) =>
  pb.collection('profiles').update<Profile>(id, data)
export const deleteProfile = (id: string) => pb.collection('profiles').delete(id)
