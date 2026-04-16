import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRealtime } from '@/hooks/use-realtime'
import { getLocaisList, createLocal, deleteLocal } from '@/services/locais'
import { getMeusFavoritos, toggleFavorito } from '@/services/favoritos'
import { Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function LocationsManager() {
  const { user } = useAuth()
  const [locais, setLocais] = useState<any[]>([])
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')

  const loadData = async () => {
    if (!user) return
    try {
      const [locaisData, favData] = await Promise.all([getLocaisList(), getMeusFavoritos(user.id)])
      setLocais(locaisData)
      setFavoritos(new Set(favData.map((f) => f.local_id)))
    } catch (error) {
      toast.error('Erro ao carregar locais')
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) return
    try {
      await createLocal({ nome, endereco })
      setNome('')
      setEndereco('')
      toast.success('Local adicionado com sucesso!')
    } catch {
      toast.error('Erro ao adicionar local.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLocal(id)
      toast.success('Local removido!')
    } catch {
      toast.error('Erro ao remover local.')
    }
  }

  const handleToggleFav = async (localId: string) => {
    if (!user) return
    try {
      await toggleFavorito(user.id, localId)
    } catch {
      toast.error('Erro ao atualizar favorito.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Locais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Nome do Local</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Ex: Biblioteca Central"
            />
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Endereço (Opcional)</label>
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Bloco B, Térreo"
            />
          </div>
          <Button type="submit" className="sm:w-auto w-full">
            Adicionar
          </Button>
        </form>

        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-16 text-center">Fav</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(local.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {locais.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
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
