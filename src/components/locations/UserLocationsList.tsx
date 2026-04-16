import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRealtime } from '@/hooks/use-realtime'
import { getLocaisList } from '@/services/locais'
import { getMeusFavoritos, toggleFavorito } from '@/services/favoritos'
import { Star, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function UserLocationsList() {
  const { user } = useAuth()
  const [locais, setLocais] = useState<any[]>([])
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())

  const loadData = async () => {
    if (!user) return
    try {
      const [locaisData, favData] = await Promise.all([getLocaisList(), getMeusFavoritos(user.id)])
      setLocais(locaisData)
      setFavoritos(new Set(favData.map((f) => f.local_id)))
    } catch (error) {
      toast.error('Erro ao carregar locais.')
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('locais', () => {
    getLocaisList().then(setLocais)
  })

  useRealtime('favoritos_locais', () => {
    if (user)
      getMeusFavoritos(user.id).then((data) => setFavoritos(new Set(data.map((f) => f.local_id))))
  })

  const handleToggleFav = async (localId: string) => {
    if (!user) return
    try {
      await toggleFavorito(user.id, localId)
    } catch {
      toast.error('Erro ao atualizar favorito.')
    }
  }

  return (
    <Card className="w-full mx-auto shadow-elevation border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-600" />
          <CardTitle>Locais de Estudo</CardTitle>
        </div>
        <CardDescription>Consulte os locais disponíveis e marque seus favoritos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-16 text-center">Fav</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locais.map((local) => {
                const isFav = favoritos.has(local.id)
                return (
                  <TableRow key={local.id}>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleFav(local.id)}
                        className="text-slate-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star
                          className={cn(
                            'h-5 w-5 mx-auto',
                            isFav && 'fill-yellow-400 text-yellow-400',
                          )}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{local.nome}</TableCell>
                    <TableCell className="text-slate-600">{local.endereco || '-'}</TableCell>
                  </TableRow>
                )
              })}
              {locais.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                    Nenhum local cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
