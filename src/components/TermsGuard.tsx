import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Loader2 } from 'lucide-react'

export function TermsGuard() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [needsTerms, setNeedsTerms] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) {
      setNeedsTerms(false)
      return
    }

    pb.collection('termos_uso')
      .getList(1, 1, { sort: '-created' })
      .then((res) => {
        if (res.items.length > 0) {
          const latestTerm = res.items[0]
          const userAcceptedAt = user.termos_aceitos_em
            ? new Date(user.termos_aceitos_em).getTime()
            : 0
          const termUpdatedAt = new Date(latestTerm.updated).getTime()

          if (!userAcceptedAt || userAcceptedAt < termUpdatedAt) {
            setNeedsTerms(true)
          } else {
            setNeedsTerms(false)
          }
        } else {
          setNeedsTerms(false)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch termos', err)
        setNeedsTerms(false)
      })
  }, [user])

  if (authLoading || needsTerms === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (needsTerms && location.pathname !== '/termos-de-uso') {
    return <Navigate to="/termos-de-uso" replace />
  }

  return <Outlet />
}
