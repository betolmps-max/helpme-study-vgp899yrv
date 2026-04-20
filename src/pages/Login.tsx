import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'

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
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import logoImg from '@/assets/adapta-image-1776703638057-8b530.png'

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { signIn, user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    const { error } = await signIn(data.email, data.password)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: getErrorMessage(error),
      })
      return
    }

    toast({
      title: 'Login realizado com sucesso!',
      description: 'Bem-vindo ao Helpme Study!',
    })
    navigate('/home')
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto pt-8 pb-12 font-sans">
      <div className="mb-6 animate-fade-in-down">
        <img
          src={logoImg}
          alt="Help me study Logo"
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full shadow-lg border-4 border-white"
        />
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c1c3c] mb-2 text-center tracking-tight animate-fade-in-up leading-tight">
        Help me study!
      </h1>
      <p
        className="text-base sm:text-lg text-slate-600 mb-8 text-center animate-fade-in-up font-medium"
        style={{ animationDelay: '100ms' }}
      >
        Connecting students and tutors
      </p>

      <Card
        className="w-full border-2 border-[#e6e8f4] shadow-sm rounded-3xl overflow-hidden bg-white animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <CardHeader className="space-y-2 text-center pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#1c1c3c]">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
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
                    <FormLabel className="text-slate-700 font-semibold">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          placeholder="nome@exemplo.com"
                          className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-600"
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
                      <FormLabel className="text-slate-700 font-semibold">Senha</FormLabel>
                      <a
                        href="#"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
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
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-600"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 pb-6 bg-slate-50/50 border-t border-slate-100">
          <div className="text-center text-sm text-slate-600 font-medium">
            Ainda não tem uma conta?{' '}
            <Link
              to="/register"
              className="font-bold text-indigo-600 transition-colors hover:text-indigo-500"
            >
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
