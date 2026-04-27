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

export const getStaffUsers = (searchTerm: string = '') => {
  let filter = '(user_type = "professor" || user_type = "monitor")'
  if (searchTerm) {
    const term = searchTerm.replace(/"/g, '')
    filter += ` && (name ~ "${term}" || email ~ "${term}")`
  }
  return pb.collection('users').getFullList({
    filter,
    sort: 'name',
  })
}

export const updateUserAvatar = (id: string, file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return pb.collection('users').update(id, formData)
}
