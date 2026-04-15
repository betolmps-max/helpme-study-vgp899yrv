import pb from '@/lib/pocketbase/client'

export const getUsersList = () => {
  return pb.collection('users').getFullList({
    sort: '-created',
  })
}

export const updateUserAdminStatus = (id: string, isAdmin: boolean) => {
  return pb.collection('users').update(id, {
    is_admin: isAdmin,
  })
}

export const getMonitors = () => {
  return pb.collection('users').getFullList({
    filter: 'user_type = "monitor"',
    sort: 'name',
  })
}
