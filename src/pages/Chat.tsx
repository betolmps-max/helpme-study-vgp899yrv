import { useState, useEffect, useRef, useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Send, MessageCircle, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getConversas,
  getMensagens,
  enviarMensagem,
  type Conversa,
  type Mensagem,
} from '@/services/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function Chat() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const conversaIdParam = searchParams.get('conversaId')

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [activeConversaId, setActiveConversaId] = useState<string | null>(conversaIdParam)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversas = async () => {
    if (!user) return
    try {
      const data = await getConversas(user.id)
      setConversas(data)
      if (!activeConversaId && data.length > 0 && !conversaIdParam) {
        setActiveConversaId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load conversas', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMensagens = async (id: string) => {
    setLoadingMessages(true)
    try {
      const data = await getMensagens(id)
      setMensagens(data)
    } catch (err) {
      console.error('Failed to load mensagens', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    loadConversas()
  }, [user])

  useEffect(() => {
    if (activeConversaId) {
      loadMensagens(activeConversaId)
      setSearchParams({ conversaId: activeConversaId }, { replace: true })
    }
  }, [activeConversaId])

  useRealtime('conversas', () => loadConversas(), !!user)
  useRealtime(
    'mensagens',
    (e) => {
      if (e.record.conversa_id === activeConversaId) {
        loadMensagens(activeConversaId)
      } else {
        loadConversas() // Refresh list to update ordering/preview if it's another chat
      }
    },
    !!user,
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, loadingMessages])

  if (!user) return <Navigate to="/login" replace />

  const activeConversa = conversas.find((c) => c.id === activeConversaId)

  const getChatName = (conversa: Conversa) => {
    if (!conversa.expand?.participantes) return 'Chat'
    const others = conversa.expand.participantes.filter((p) => p.id !== user.id)
    if (others.length === 0) return 'Anotações Pessoais'
    return others.map((o) => o.name || o.email).join(', ')
  }

  const getChatInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversaId || sending) return

    setSending(true)
    try {
      await enviarMensagem(activeConversaId, user.id, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      console.error('Erro ao enviar', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-6xl mx-auto border rounded-xl overflow-hidden bg-white shadow-sm animate-in fade-in zoom-in-95">
      {/* Sidebar - Conversas */}
      <div
        className={cn(
          'w-full sm:w-80 flex flex-col border-r bg-slate-50/50 shrink-0 transition-all',
          activeConversaId ? 'hidden sm:flex' : 'flex',
        )}
      >
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            Mensagens
          </h2>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversas.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversas.map((conversa) => {
                const name = getChatName(conversa)
                const isActive = conversa.id === activeConversaId
                return (
                  <button
                    key={conversa.id}
                    onClick={() => setActiveConversaId(conversa.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors',
                      isActive ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-100',
                    )}
                  >
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarFallback
                        className={
                          isActive ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-700'
                        }
                      >
                        {getChatInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-semibold truncate',
                          isActive ? 'text-indigo-900' : 'text-slate-700',
                        )}
                      >
                        {name}
                      </p>
                      {conversa.expand?.agendamento_id && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          Ref: {conversa.expand.agendamento_id.assunto}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-white min-w-0',
          !activeConversaId && 'hidden sm:flex',
        )}
      >
        {activeConversa ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden -ml-2"
                onClick={() => setActiveConversaId(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-left"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
              <Avatar className="h-10 w-10 border border-slate-200">
                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                  {getChatInitials(getChatName(activeConversa))}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-800 leading-tight">
                  {getChatName(activeConversa)}
                </h3>
                {activeConversa.expand?.agendamento_id && (
                  <p className="text-xs text-indigo-600 font-medium">
                    Agendamento: {activeConversa.expand.agendamento_id.assunto}
                  </p>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-slate-50/50">
              {loadingMessages ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : mensagens.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-60 pt-20">
                  <MessageCircle className="h-12 w-12" />
                  <p>Inicie a conversa enviando uma mensagem abaixo.</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {mensagens.map((msg, i) => {
                    const isMe = msg.remetente_id === user.id
                    const showHeader = i === 0 || mensagens[i - 1].remetente_id !== msg.remetente_id

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
                      >
                        {showHeader && !isMe && (
                          <span className="text-[11px] font-medium text-slate-500 mb-1 ml-1">
                            {msg.expand?.remetente_id?.name ||
                              msg.expand?.remetente_id?.email ||
                              'Usuário'}
                          </span>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-sm'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.conteudo}
                          </p>
                          <span
                            className={cn(
                              'text-[10px] mt-1 block text-right',
                              isMe ? 'text-indigo-200' : 'text-slate-400',
                            )}
                          >
                            {format(new Date(msg.created), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 bg-white border-t shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-slate-50 focus-visible:ring-indigo-500"
                  disabled={sending}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                  className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border">
              <MessageCircle className="h-8 w-8 text-indigo-300" />
            </div>
            <p className="font-medium text-slate-500">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}
