import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Link as LinkIcon, UserPlus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { createVinculo, getVinculosResponsavel } from '@/services/vinculos'
import { useRealtime } from '@/hooks/use-realtime'

export function ResponsibleDashboard({ userId }: { userId: string }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [vinculos, setVinculos] = useState<any[]>([])
  const { toast } = useToast()

  const loadVinculos = async () => {
    try {
      const data = await getVinculosResponsavel(userId)
      setVinculos(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadVinculos()
  }, [userId])

  useRealtime('responsabilidade_vinculos', () => {
    loadVinculos()
  })

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await createVinculo({
        responsavel_id: userId,
        email_dependente: email,
        status: 'pendente',
      })
      toast({
        title: 'Solicitação enviada',
        description: `Um convite de vínculo foi enviado para ${email}.`,
      })
      setEmail('')
      loadVinculos()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao solicitar vínculo',
        description: err.message || 'Verifique se o e-mail está correto e tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-elevation border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-purple-600" />
          Gerenciar Dependentes
        </CardTitle>
        <CardDescription>
          Vincule a conta de um estudante para acompanhar seu progresso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleRequestLink}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-end"
        >
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="email">E-mail do Dependente</Label>
            <Input
              id="email"
              type="email"
              placeholder="estudante@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Solicitar Vínculo
          </Button>
        </form>

        {vinculos.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700">Seus Vínculos</h4>
            <div className="grid gap-3">
              {vinculos.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50"
                >
                  <span className="text-sm font-medium">{v.email_dependente}</span>
                  <div className="flex items-center gap-2">
                    {v.status === 'pendente' && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" /> Pendente
                      </span>
                    )}
                    {v.status === 'aceito' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Aceito
                      </span>
                    )}
                    {v.status === 'recusado' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" /> Recusado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
