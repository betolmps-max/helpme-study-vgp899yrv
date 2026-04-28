import { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { searchUsersForChat } from '@/services/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'

interface NewChatDialogProps {
  currentUserId: string
  onStartChat: (userId: string) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function NewChatDialog({ currentUserId, onStartChat }: NewChatDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      return
    }
  }, [open])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearching(true)
      searchUsersForChat(query, currentUserId)
        .then(setResults)
        .catch(console.error)
        .finally(() => setSearching(false))
    }, 500)
    return () => clearTimeout(timer)
  }, [query, currentUserId])

  const handleSelect = (id: string) => {
    setOpen(false)
    onStartChat(id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {searching ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar ? pb.files.getURL(u, u.avatar) : ''} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {getInitials(u.name || u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {u.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                        {u.user_type.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="text-center p-4 text-sm text-slate-500">
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div className="text-center p-4 text-sm text-slate-500">
                Digite pelo menos 2 caracteres para buscar.
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
