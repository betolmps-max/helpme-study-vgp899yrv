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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createAvaliacao } from '@/services/avaliacoes'

export function AvaliacaoDialog({ open, onOpenChange, agendamento, currentUser, onSuccess }: any) {
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  if (!agendamento || !currentUser) return null

  const isMonitor = currentUser.id === agendamento.monitor_id
  const targetUser = isMonitor ? agendamento.expand?.estudante_id : agendamento.expand?.monitor_id
  const targetId = isMonitor ? agendamento.estudante_id : agendamento.monitor_id

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNota(0)
      setHoverNota(0)
      setComentario('')
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async () => {
    if (nota === 0) {
      toast.error('Selecione uma nota de 1 a 5 estrelas.')
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
      toast.success('Avaliação enviada com sucesso!')
      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      toast.error('Erro ao enviar avaliação.')
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
