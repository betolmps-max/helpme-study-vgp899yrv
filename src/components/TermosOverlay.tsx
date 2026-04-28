import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LogOut } from 'lucide-react'

export function TermosOverlay({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [termos, setTermos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchTermos = async () => {
      try {
        const records = await pb.collection('termos_uso').getList(1, 1, {
          sort: '-created',
        })
        if (records.items.length > 0) {
          setTermos(records.items[0])
        }
      } catch (error) {
        console.error('Failed to fetch termos', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTermos()
  }, [user])

  if (!user) return <>{children}</>

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!termos) return <>{children}</>

  const hasAccepted = user.termos_aceitos_em
  const acceptedAt = hasAccepted ? new Date(user.termos_aceitos_em).getTime() : 0
  const termosUpdatedAt = new Date(termos.updated).getTime()

  const needsToAccept = !hasAccepted || acceptedAt < termosUpdatedAt

  if (!needsToAccept) return <>{children}</>

  const isUpdate = !!hasAccepted

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const now = new Date().toISOString()
      await pb.collection('users').update(user.id, {
        termos_aceitos_em: now,
      })
      await pb.collection('users').authRefresh()
    } catch (error) {
      console.error('Failed to accept termos', error)
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-indigo-100">
        <CardHeader className="bg-white z-10 shadow-sm border-b relative">
          <CardTitle className="text-xl sm:text-2xl text-center text-indigo-900 font-bold leading-tight">
            {isUpdate
              ? 'Atualização dos Termos de Uso e Política de Privacidade'
              : 'HELP ME STUDY! TERMOS DE USO E POLÍTICA DE PRIVACIDADE'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50/50">
          <ScrollArea className="h-full w-full p-4 sm:p-8">
            <div className="whitespace-pre-wrap text-sm sm:text-base text-slate-700 leading-relaxed font-medium pb-4">
              {termos.conteudo}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row justify-center gap-3 p-4 sm:p-6 bg-white border-t z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button
            variant="ghost"
            size="lg"
            onClick={signOut}
            disabled={accepting}
            className="w-full sm:w-auto text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          <Button
            size="lg"
            onClick={handleAccept}
            disabled={accepting}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 sm:px-12 text-base sm:text-lg shadow-md transition-all hover:shadow-lg"
          >
            {accepting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Aceitar e Continuar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
