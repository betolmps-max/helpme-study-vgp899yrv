import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { depositHelps, withdrawHelps } from '@/services/wallet'
import { toast } from 'sonner'
import { Loader2, Plus, ArrowDownToLine, CreditCard, Landmark } from 'lucide-react'
import { TransactionStatement } from './TransactionStatement'

export function WalletDialogs({ user }: { user: any }) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Valor inválido')
    setLoading(true)
    try {
      await depositHelps(Number(amount))
      toast.success('Fundos adicionados com sucesso! (Simulado)')
      setDepositOpen(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar fundos')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Valor inválido')
    if (!details) return toast.error('Informe os detalhes do PIX ou Conta bancária')
    if (Number(amount) > (user?.saldo || 0)) return toast.error('Saldo insuficiente')

    setLoading(true)
    try {
      await withdrawHelps(Number(amount), details)
      toast.success('Solicitação de resgate enviada com sucesso!')
      setWithdrawOpen(false)
      setAmount('')
      setDetails('')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao solicitar resgate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <TransactionStatement />
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Fundos
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Fundos</DialogTitle>
            <DialogDescription>Simule a adição de fundos via Cartão ou PIX.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <CreditCard className="mr-2 h-4 w-4" /> Cartão
              </Button>
              <Button variant="outline" className="flex-1">
                <Landmark className="mr-2 h-4 w-4" /> PIX
              </Button>
            </div>
            <Button className="w-full" onClick={handleDeposit} disabled={loading || !amount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Pagamento Simulado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <ArrowDownToLine className="mr-2 h-4 w-4" /> Resgatar Saldo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Saldo</DialogTitle>
            <DialogDescription>
              Solicite transferência do seu saldo para sua conta bancária.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor a resgatar (R$)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 50.00"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                <p>
                  Saldo disponível:{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    user?.saldo || 0,
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Detalhes da Conta ou Chave PIX</Label>
              <Input
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ex: pix@email.com"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={loading || Number(amount) > (user?.saldo || 0) || !amount}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Solicitar Resgate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
