import { useEffect, useState, useRef, createContext, useContext } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

interface TermsContextType {
  isTermsModalOpen: boolean
}

const TermsContext = createContext<TermsContextType>({ isTermsModalOpen: false })

export const useTermsModal = () => useContext(TermsContext)
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Loader2, LogOut, Info } from 'lucide-react'

export function TermosOverlay({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [termos, setTermos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

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

  const checkScroll = () => {
    if (viewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
      if (scrollHeight <= clientHeight || scrollHeight - scrollTop - clientHeight < 20) {
        setHasScrolledToBottom(true)
      }
    }
  }

  useEffect(() => {
    if (termos && !loading && viewportRef.current) {
      const observer = new ResizeObserver(() => checkScroll())
      observer.observe(viewportRef.current)

      // Initial check to handle short content or immediate rendering
      const timeoutId = setTimeout(checkScroll, 100)

      return () => {
        observer.disconnect()
        clearTimeout(timeoutId)
      }
    }
  }, [termos, loading])

  const hasAccepted = user?.termos_aceitos_em
  const acceptedAt = hasAccepted ? new Date(user.termos_aceitos_em).getTime() : 0
  const termosUpdatedAt = termos ? new Date(termos.updated).getTime() : 0

  const needsToAccept =
    !!user && !loading && !!termos && (!hasAccepted || acceptedAt < termosUpdatedAt)

  const isUpdate = !!hasAccepted

  const handleAccept = async () => {
    if (!hasScrolledToBottom) return
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

  const isTermsModalOpen = (!!user && loading) || needsToAccept

  return (
    <TermsContext.Provider value={{ isTermsModalOpen }}>
      {children}

      {loading && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/80 backdrop-blur-sm transition-all duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {needsToAccept && (
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
              <ScrollArea
                className="h-full w-full p-4 sm:p-8"
                viewportRef={viewportRef}
                onScroll={() => {
                  if (!hasScrolledToBottom) checkScroll()
                }}
              >
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

              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="w-full sm:w-auto inline-flex outline-none">
                      <Button
                        size="lg"
                        onClick={handleAccept}
                        disabled={accepting || !hasScrolledToBottom}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 sm:px-12 text-base sm:text-lg shadow-md transition-all hover:shadow-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:pointer-events-none"
                      >
                        {accepting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Li e Aceito
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!hasScrolledToBottom && (
                    <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700">
                      <p className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Leia os termos até o final para aceitar
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        </div>
      )}
    </TermsContext.Provider>
  )
}
