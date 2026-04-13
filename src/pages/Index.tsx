import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, Lock, Mail, School } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Index() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)

    if (data.email === 'demo@eduplatform.com' && data.password === 'demo123') {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando para o painel...',
      })
      // Here you would normally redirect to dashboard
    } else {
      toast({
        variant: 'destructive',
        title: 'Credenciais inválidas',
        description: 'Por favor, verifique seu e-mail e senha e tente novamente.',
      })
    }
  }

  return (
    <Card className="border-slate-200 shadow-elevation">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <School className="h-6 w-6 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Bem-vindo de volta
        </CardTitle>
        <CardDescription className="text-slate-500">
          Insira suas credenciais para acessar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="nome@exemplo.com"
                        className="pl-9"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-slate-700">Senha</FormLabel>
                    <a
                      href="#"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      onClick={(e) => {
                        e.preventDefault()
                        toast({ description: 'Recuperação de senha não implementada no demo.' })
                      }}
                    >
                      Esqueci minha senha
                    </a>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-9 pr-9"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        </span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-4">
        <div className="text-center text-sm text-slate-500">
          Ainda não tem uma conta?{' '}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500"
          >
            Cadastre-se
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
