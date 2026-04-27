import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { getMyTransactions, type Transacao } from '@/services/transacoes'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const TIPO_LABELS: Record<string, string> = {
  deposito: 'Depósito',
  pagamento_sessao: 'Pagamento de Sessão',
  recebimento_sessao: 'Recebimento de Sessão',
  estorno: 'Estorno',
  resgate: 'Resgate',
  gorjeta: 'Gorjeta',
}

const isPositive = (tipo: string) => {
  return ['deposito', 'recebimento_sessao', 'estorno'].includes(tipo)
}

export function TransactionStatement() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      getMyTransactions()
        .then(setTransactions)
        .finally(() => setLoading(false))
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" title="Ver Extrato">
          <FileText className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Extrato</SheetTitle>
          <SheetDescription>Acompanhe todas as suas movimentações financeiras.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-20" />
              <p>Nenhuma transação encontrada.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const positive = isPositive(tx.tipo)
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-full',
                            positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                          )}
                        >
                          {positive ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {user?.user_type === 'lider_escolar' && tx.tipo === 'recebimento_sessao'
                              ? 'Comissão de Uso do Local'
                              : TIPO_LABELS[tx.tipo] || tx.tipo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(tx.created), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn('font-bold', positive ? 'text-green-600' : 'text-red-600')}
                        >
                          {positive ? '+' : '-'}{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(tx.valor)}
                        </p>
                        <Badge
                          variant={tx.status === 'cancelado' ? 'destructive' : 'secondary'}
                          className="text-[10px] uppercase px-1 py-0 h-4 mt-1"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
