import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getDisciplinas, Disciplina } from '@/services/disciplinas'
import { getLocaisList } from '@/services/locais'
import { getMentorProfiles } from '@/services/profiles'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMentorProfiles(), getDisciplinas(), getLocaisList()])
      .then(([p, d, l]) => {
        setProfiles(p)
        setDisciplinas(d)
        setLocais(l)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProfiles =
    filterSubject === 'all'
      ? profiles
      : profiles.filter((p) => {
          if (!p.subjects) return false
          const subjList = p.subjects.split(',').map((s: string) => s.trim().toLowerCase())
          return subjList.includes(filterSubject.toLowerCase())
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

        <div className="w-full md:w-72">
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
          {filterSubject !== 'all' && (
            <Button variant="link" onClick={() => setFilterSubject('all')} className="mt-2">
              Limpar filtro
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
