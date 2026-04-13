import pb from '@/lib/pocketbase/client'

export const getAppointmentsList = () => {
  return pb.collection('appointments').getFullList({
    sort: '-created',
  })
}
