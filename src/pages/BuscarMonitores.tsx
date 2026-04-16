import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getDisciplinas, Disciplina } from '@/services/disciplinas'
import { getLocaisList } from '@/services/locais'
import { getMentorProfiles } from '@/services/profiles'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MentorCard } from '@/components/MentorCard'

export default function BuscarMonitores() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [profiles, setProfiles] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [locais, setLocais] = useState<any[]>([])

  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    Promise.all([getMentorProfiles(), getDisciplinas(), getLocaisList()])
      .then(([p, d, l]) => {
        setProfiles(p)
        setDisciplinas(d)
        setLocais(l)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('profiles', () => {
    loadData()
  })

  useRealtime('users', () => {
    loadData()
  })

  const filteredProfiles = profiles.filter((p) => {
    if (filterSubject !== 'all') {
      if (!p.subjects) return false
      const subjList = p.subjects.split(',').map((s: string) => s.trim().toLowerCase())
      if (!subjList.includes(filterSubject.toLowerCase())) return false
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const name = (p.expand?.user_id?.name || '').toLowerCase()
      const bio = (p.bio || '').toLowerCase()
      const subjects = (p.subjects || '').toLowerCase()
      if (!name.includes(query) && !bio.includes(query) && !subjects.includes(query)) {
        return false
      }
    }

    return true
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buscar Monitores</h1>
          <p className="text-muted-foreground mt-1">
            Encontre professores e monitores para te ajudar nos estudos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={d.nome}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse h-[350px] bg-muted/50" />
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Nenhum mentor encontrado</h3>
          <p className="text-muted-foreground mt-1">
            Tente buscar por outra disciplina ou limpe o filtro.
          </p>
          {(filterSubject !== 'all' || searchQuery !== '') && (
            <Button
              variant="link"
              onClick={() => {
                setFilterSubject('all')
                setSearchQuery('')
              }}
              className="mt-2"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <MentorCard
              key={profile.id}
              profile={profile}
              user={user}
              disciplinas={disciplinas}
              locais={locais}
              onBooked={() => {
                toast({
                  title: 'Agendamento solicitado!',
                  description: 'O monitor receberá sua solicitação em breve.',
                })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
