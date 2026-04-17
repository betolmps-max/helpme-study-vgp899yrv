import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { BellRing, Check, X, Loader2 } from 'lucide-react'
import { getVinculosDependente, updateVinculoStatus } from '@/services/vinculos'
import { useRealtime } from '@/hooks/use-realtime'

export function StudentPendingLinks({ userId }: { userId: string }) {
  const [links, setLinks] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  const loadLinks = async () => {
    try {
      const data = await getVinculosDependente(userId)
      setLinks(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [userId])

  useRealtime('responsabilidade_vinculos', () => {
    loadLinks()
  })

  const handleDecision = async (id: string, status: 'aceito' | 'recusado') => {
    setIsProcessing(id)
    try {
      await updateVinculoStatus(id, status)
      toast({
        title: status === 'aceito' ? 'Vínculo aceito' : 'Vínculo recusado',
        description: 'O responsável foi notificado da sua decisão.',
      })
      loadLinks()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao processar',
        description: err.message,
      })
    } finally {
      setIsProcessing(null)
    }
  }

  if (links.length === 0) return null

  return (
    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
          <BellRing className="h-5 w-5" />
          Solicitações de Vínculo
        </CardTitle>
        <CardDescription className="text-amber-700/80">
          Você tem solicitações de responsáveis aguardando sua resposta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-amber-100 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {link.expand?.responsavel_id?.name || 'Um usuário'} deseja se vincular como seu
                responsável.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ao aceitar, ele poderá acompanhar suas atividades na plataforma.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => handleDecision(link.id, 'recusado')}
                disabled={isProcessing === link.id}
              >
                {isProcessing === link.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                Recusar
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDecision(link.id, 'aceito')}
                disabled={isProcessing === link.id}
              >
                {isProcessing === link.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Aceitar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
