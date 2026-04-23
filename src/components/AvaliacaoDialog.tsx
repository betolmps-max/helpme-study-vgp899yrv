import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createAvaliacao } from '@/services/avaliacoes'
import { sendTip } from '@/services/wallet'

export function AvaliacaoDialog({ open, onOpenChange, agendamento, currentUser, onSuccess }: any) {
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  const [showTip, setShowTip] = useState(false)
  const [tipAmount, setTipAmount] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState('')
  const [isTipCustom, setIsTipCustom] = useState(false)

  if (!agendamento || !currentUser) return null

  const isMonitor = currentUser.id === agendamento.monitor_id
  const targetUser = isMonitor ? agendamento.expand?.estudante_id : agendamento.expand?.monitor_id
  const targetId = isMonitor ? agendamento.estudante_id : agendamento.monitor_id

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNota(0)
      setHoverNota(0)
      setComentario('')
      setShowTip(false)
      setTipAmount(null)
      setIsTipCustom(false)
      setCustomTip('')
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async () => {
    if (nota === 0) {
      toast.error('Selecione uma nota de 1 a 5 estrelas.')
      return
    }

    if (nota === 5 && !isMonitor && !showTip) {
      setShowTip(true)
      return
    }

    setLoading(true)
    try {
      await createAvaliacao({
        agendamento_id: agendamento.id,
        avaliador_id: currentUser.id,
        avaliado_id: targetId,
        nota,
        comentario,
      })

      if (tipAmount && tipAmount > 0) {
        await sendTip(agendamento.id, tipAmount)
      }

      toast.success('Avaliação enviada com sucesso!')
      onSuccess()
      handleOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar {isMonitor ? 'Estudante' : 'Monitor'}</DialogTitle>
          <DialogDescription>
            Como foi a sessão com {targetUser?.name || 'o usuário'}?
            {isMonitor
              ? ' Avalie o empenho e dedicação do estudante.'
              : ' Avalie a qualidade da ajuda e do seu aprendizado.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-colors ${
                  star <= (hoverNota || nota) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'
                }`}
                onMouseEnter={() => setHoverNota(star)}
                onMouseLeave={() => setHoverNota(0)}
                onClick={() => setNota(star)}
              />
            ))}
          </div>
          <Textarea
            placeholder="Deixe um comentário (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />

          {showTip && (
            <div className="w-full mt-4 p-4 border rounded-md bg-muted/30">
              <Label className="text-sm font-semibold mb-2 block">Dar uma Gorjeta (Opcional)</Label>
              <div className="flex gap-2 flex-wrap mb-3">
                {[2, 5, 10].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={tipAmount === val ? 'default' : 'outline'}
                    onClick={() => {
                      setTipAmount(val)
                      setIsTipCustom(false)
                    }}
                  >
                    {val} Helps
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={isTipCustom ? 'default' : 'outline'}
                  onClick={() => {
                    setIsTipCustom(true)
                    setTipAmount(0)
                    setCustomTip('')
                  }}
                >
                  Mais
                </Button>
              </div>
              {isTipCustom && (
                <Input
                  type="number"
                  min="1"
                  placeholder="Valor customizado"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value)
                    setTipAmount(Number(e.target.value))
                  }}
                />
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {showTip
              ? 'Finalizar e Enviar'
              : nota === 5 && !isMonitor
                ? 'Continuar'
                : 'Enviar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
