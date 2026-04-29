import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const formatText = (text: string) => {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*|\*[^*]+\*)/g)
    return (
      <span key={i} className="block min-h-[1.2em] mb-1 text-slate-700">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-bold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            )
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={j} className="italic text-slate-800">
                {part.slice(1, -1)}
              </em>
            )
          }
          return <span key={j}>{part}</span>
        })}
      </span>
    )
  })
}

export default function TermosDeUso() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [termos, setTermos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    pb.collection('termos_uso')
      .getList(1, 1, { sort: '-created' })
      .then((res) => {
        if (res.items.length > 0) {
          setTermos(res.items[0])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, navigate])

  const checkScroll = () => {
    if (viewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
      if (
        scrollHeight <= clientHeight ||
        scrollHeight - Math.ceil(scrollTop) - clientHeight <= 30
      ) {
        setHasScrolledToBottom(true)
      }
    }
  }

  useEffect(() => {
    if (termos && !loading && viewportRef.current) {
      const observer = new ResizeObserver(() => checkScroll())
      observer.observe(viewportRef.current)
      const timeoutId = setTimeout(checkScroll, 150)
      return () => {
        observer.disconnect()
        clearTimeout(timeoutId)
      }
    }
  }, [termos, loading])

  const handleAccept = async () => {
    if (!hasScrolledToBottom || !user) return
    setAccepting(true)
    try {
      const now = new Date().toISOString()
      await pb.collection('users').update(user.id, {
        termos_aceitos_em: now,
      })
      await pb.collection('users').authRefresh()
      navigate('/home')
    } catch (error) {
      console.error('Failed to accept termos', error)
      setAccepting(false)
    }
  }

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      <div className="mb-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-2">
          <ShieldCheck className="w-8 h-8 text-indigo-700" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Termos de Uso e Privacidade
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Para continuar usando o Help Me Study, por favor, leia e aceite nossos termos atualizados.
        </p>
      </div>

      <Card className="w-full shadow-xl border-indigo-100/50 bg-white/50 backdrop-blur-sm overflow-hidden flex flex-col max-h-[65vh] animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-0 flex-1 overflow-hidden relative bg-slate-50/50">
          <div
            ref={viewportRef}
            className="h-full w-full overflow-y-auto p-6 sm:p-10 scroll-smooth"
            onScroll={() => {
              if (!hasScrolledToBottom) checkScroll()
            }}
          >
            <div className="max-w-none text-sm sm:text-base">
              {termos?.conteudo ? (
                formatText(termos.conteudo)
              ) : (
                <p className="text-center text-slate-500 italic">Nenhum termo encontrado.</p>
              )}
            </div>
          </div>

          {!hasScrolledToBottom && termos?.conteudo && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
          )}
        </CardContent>

        <CardFooter className="bg-white border-t p-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={accepting}
            className="w-full sm:w-auto text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair e Voltar depois
          </Button>

          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto gap-2">
            <Button
              size="lg"
              onClick={handleAccept}
              disabled={accepting || !hasScrolledToBottom}
              className={cn(
                'w-full sm:w-auto px-8 transition-all duration-500',
                hasScrolledToBottom
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80',
              )}
            >
              {accepting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Li e Aceito
            </Button>
            {!hasScrolledToBottom && (
              <span className="text-xs text-indigo-600 font-medium animate-pulse">
                Role até o final para aceitar ↓
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
