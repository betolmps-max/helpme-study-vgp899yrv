import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getDisciplinas, Disciplina } from '@/services/disciplinas'
import { getLocaisList } from '@/services/locais'
import pb from '@/lib/pocketbase/client'

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
  const [favoritosLocais, setFavoritosLocais] = useState<any[]>([])

  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterLocal, setFilterLocal] = useState<string>('all')
  const [filterName, setFilterName] = useState<string>('')

  const [loading, setLoading] = useState(true)

  const loadData = () => {
    Promise.all([
      pb.collection('users').getFullList(),
      pb.collection('profiles').getFullList(),
      getDisciplinas(),
      getLocaisList(),
      pb.collection('favoritos_locais').getFullList(),
    ])
      .then(([u, p, d, l, favs]) => {
        const combinedProfiles = u.map((user) => {
          const userProfile = p.find((prof) => prof.user_id === user.id) || {
            id: `dummy-${user.id}`,
            user_id: user.id,
          }
          return { ...userProfile, expand: { user_id: user } }
        })
        setProfiles(combinedProfiles)
        setDisciplinas(d)
        setLocais(l)
        setFavoritosLocais(favs)
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

  useRealtime('favoritos_locais', () => {
    loadData()
  })

  const filteredProfiles = profiles.filter((p) => {
    const userType = p.expand?.user_id?.user_type

    if (filterSubject !== 'all') {
      if (!p.subjects) return false
      const subjList = p.subjects.split(',').map((s: string) => s.trim().toLowerCase())
      if (!subjList.includes(filterSubject.toLowerCase())) return false
    }

    if (filterLocal !== 'all') {
      const monitorLocais = favoritosLocais
        .filter((f) => f.user_id === p.expand?.user_id?.id)
        .map((f) => f.local_id)
      if (!monitorLocais.includes(filterLocal)) return false
    }

    if (filterName.trim() !== '') {
      const query = filterName.trim().toLowerCase()
      const name = (p.expand?.user_id?.name || '').toLowerCase()
      const email = (p.expand?.user_id?.email || '').toLowerCase()
      const subjectStr = (p.subjects || '').toLowerCase()
      if (!name.includes(query) && !email.includes(query) && !subjectStr.includes(query)) {
        return false
      }
    }

    return true
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunidade</h1>
          <p className="text-muted-foreground mt-1">
            Encontre professores, monitores, estudantes e líderes na plataforma.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap w-full lg:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou matéria..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as matérias</SelectItem>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={d.nome}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={filterLocal} onValueChange={setFilterLocal}>
              <SelectTrigger>
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os locais</SelectItem>
                {locais.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome}
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
          <h3 className="text-lg font-medium">Nenhum usuário encontrado para esta busca</h3>
          <p className="text-muted-foreground mt-1">Tente buscar com outros filtros ou limpe-os.</p>
          {(filterSubject !== 'all' || filterLocal !== 'all' || filterName !== '') && (
            <Button
              variant="link"
              onClick={() => {
                setFilterSubject('all')
                setFilterLocal('all')
                setFilterName('')
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
