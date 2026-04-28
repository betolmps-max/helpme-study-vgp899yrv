import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getAgendamento } from '@/services/agendamentos'
import { payAgendamento, depositHelps } from '@/services/wallet'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Wallet, CreditCard, Smartphone, QrCode, Loader2, CheckCircle2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Checkout() {
  const { type, id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [agendamento, setAgendamento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(type === 'deposit' ? 'credit_card' : 'wallet')

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [errors, setErrors] = useState<any>({})

  useEffect(() => {
    if (authLoading) return

    if (type === 'agendamento' && id) {
      getAgendamento(id)
        .then((data) => {
          if (data.status !== 'pendente') {
            toast.error('Este agendamento não está pendente de pagamento')
            navigate('/agendamentos')
            return
          }
          setAgendamento(data)
          setLoading(false)
        })
        .catch(() => {
          toast.error('Erro ao carregar agendamento')
          navigate('/agendamentos')
        })
    } else if (type === 'deposit') {
      const amount = searchParams.get('amount')
      if (!amount || isNaN(Number(amount))) {
        toast.error('Valor de depósito inválido')
        navigate('/home')
      } else {
        setLoading(false)
      }
    } else {
      navigate('/home')
    }
  }, [type, id, searchParams, authLoading, navigate])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`
    }
    return v
  }

  const validateForm = () => {
    if (paymentMethod !== 'credit_card') return true
    const newErrors: any = {}
    if (cardNumber.replace(/\D/g, '').length < 16) newErrors.cardNumber = 'Número inválido'
    if (!cardName.trim()) newErrors.cardName = 'Nome obrigatório'
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) newErrors.cardExpiry = 'Inválido (MM/AA)'
    if (!/^\d{3,4}$/.test(cardCvv)) newErrors.cardCvv = 'Inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const baseValue =
    type === 'deposit'
      ? Number(searchParams.get('amount') || 0)
      : agendamento?.valor_pago
        ? Math.round((agendamento.valor_pago / 1.05) * 100) / 100
        : 0

  const fee = baseValue * 0.05
  const totalToPay = type === 'deposit' ? baseValue + fee : agendamento?.valor_pago || 0

  const handlePayment = async () => {
    if (paymentMethod === 'wallet' && (user?.saldo || 0) < totalToPay) {
      return toast.error('Saldo insuficiente na carteira.')
    }
    if (!validateForm()) return

    setProcessing(true)
    try {
      if (type === 'agendamento' && id) {
        await payAgendamento(id, paymentMethod)
      } else if (type === 'deposit') {
        if (paymentMethod === 'wallet') {
          throw new Error('Não é possível depositar usando o saldo da carteira.')
        }
        await depositHelps(baseValue)
      }
      setSuccess(true)
      toast.success('Pagamento autorizado com sucesso!')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  if (loading || authLoading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12 p-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="text-center py-8 border-green-200 bg-green-50/50 shadow-sm">
          <CardContent>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h2>
            <p className="text-slate-600 mb-6">
              Sua transação foi aprovada e registrada com sucesso.
            </p>
            <Button
              onClick={() => navigate(type === 'agendamento' ? '/agendamentos' : '/home')}
              className="w-full"
            >
              {type === 'agendamento' ? 'Voltar aos Agendamentos' : 'Voltar ao Início'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mt-2">Escolha sua forma de pagamento.</p>
        </div>

        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
          {type !== 'deposit' && (
            <div
              className={cn(
                'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors',
                paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50',
              )}
            >
              <RadioGroupItem value="wallet" id="wallet" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="wallet" className="font-semibold text-base cursor-pointer block">
                  Saldo da Carteira
                </Label>
                <p className="text-sm text-muted-foreground">
                  Utilize seu saldo disponível na plataforma.
                </p>
                <p className="text-sm font-medium mt-1 text-primary">
                  Disponível:{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    user?.saldo || 0,
                  )}
                </p>
                {(user?.saldo || 0) < totalToPay && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    Saldo insuficiente. Faça uma recarga.
                  </p>
                )}
              </div>
              <Wallet className="h-6 w-6 text-slate-400" />
            </div>
          )}

          <div
            className={cn(
              'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors',
              paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50',
            )}
          >
            <RadioGroupItem value="credit_card" id="credit_card" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="credit_card" className="font-semibold text-base cursor-pointer block">
                Cartão de Crédito
              </Label>
              <p className="text-sm text-muted-foreground">Pague à vista com seu cartão.</p>

              {paymentMethod === 'credit_card' && (
                <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                    {errors.cardNumber && (
                      <p className="text-xs text-red-500">{errors.cardNumber}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Nome no Cartão</Label>
                    <Input
                      placeholder="NOME COMO NO CARTÃO"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                    {errors.cardName && <p className="text-xs text-red-500">{errors.cardName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Validade</Label>
                      <Input
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                      {errors.cardExpiry && (
                        <p className="text-xs text-red-500">{errors.cardExpiry}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                      />
                      {errors.cardCvv && <p className="text-xs text-red-500">{errors.cardCvv}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <CreditCard className="h-6 w-6 text-slate-400" />
          </div>

          <div
            className={cn(
              'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors',
              paymentMethod === 'digital_wallet'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-slate-50',
            )}
          >
            <RadioGroupItem value="digital_wallet" id="digital_wallet" className="mt-1" />
            <div className="flex-1">
              <Label
                htmlFor="digital_wallet"
                className="font-semibold text-base cursor-pointer block"
              >
                Carteiras Digitais
              </Label>
              <p className="text-sm text-muted-foreground">
                Pague com Apple Pay, Google Pay ou Samsung Pay.
              </p>

              {paymentMethod === 'digital_wallet' && (
                <div className="mt-4 grid gap-2 animate-in fade-in duration-300">
                  <Button
                    variant="outline"
                    className="w-full justify-center bg-black hover:bg-black/90 text-white hover:text-white"
                  >
                    Apple Pay
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-center bg-white hover:bg-gray-100 text-black border-gray-300"
                  >
                    Google Pay
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white hover:text-white border-blue-600"
                  >
                    Samsung Pay
                  </Button>
                </div>
              )}
            </div>
            <Smartphone className="h-6 w-6 text-slate-400" />
          </div>

          <div
            className={cn(
              'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors',
              paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50',
            )}
          >
            <RadioGroupItem value="pix" id="pix" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="pix" className="font-semibold text-base cursor-pointer block">
                Pix
              </Label>
              <p className="text-sm text-muted-foreground">Aprovação imediata via QR Code.</p>

              {paymentMethod === 'pix' && (
                <div className="mt-4 flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-slate-50 animate-in fade-in duration-300">
                  <div className="bg-white p-4 rounded-lg mb-4 shadow-sm border">
                    <QrCode className="h-32 w-32 text-slate-800" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground mb-4 max-w-[250px]">
                    Escaneie o QR Code com o app do seu banco ou copie a chave Pix abaixo.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        '00020101021126580014br.gov.bcb.pix0136mock-pix-key-for-checkout',
                      )
                      toast.success('Chave Pix copiada!')
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copiar Chave Pix
                  </Button>
                </div>
              )}
            </div>
            <QrCode className="h-6 w-6 text-slate-400" />
          </div>
        </RadioGroup>
      </div>

      <div className="md:col-span-1">
        <Card className="sticky top-24 border-primary/20 shadow-md">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <CardTitle>Resumo do Pedido</CardTitle>
            <CardDescription>
              {type === 'deposit'
                ? 'Adição de fundos à carteira'
                : 'Pagamento de sessão de monitoria'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {type === 'agendamento' && agendamento && (
              <div className="space-y-1 mb-6">
                <p className="text-sm font-medium">Assunto:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{agendamento.assunto}</p>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Valor Base</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  baseValue,
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Taxa de Serviço (5%)</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fee)}
              </span>
            </div>

            <div className="border-t pt-4 mt-2 flex justify-between items-center">
              <span className="font-bold text-lg">Total a Pagar</span>
              <span className="font-bold text-2xl text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalToPay,
                )}
              </span>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 pt-4 border-t flex flex-col gap-3">
            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handlePayment}
              disabled={
                processing ||
                (paymentMethod === 'wallet' && (user?.saldo || 0) < totalToPay) ||
                (type === 'deposit' && paymentMethod === 'wallet')
              }
            >
              {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {processing ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Transação 100% segura. Suas informações são criptografadas.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
