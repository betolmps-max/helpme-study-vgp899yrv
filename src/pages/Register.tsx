import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Book, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, User, Users } from 'lucide-react'

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
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import logoImg from '@/assets/adapta-image-1776703638057-8b530.png'

const signupSchema = z.object({
  role: z.enum(['professor', 'monitor', 'student', 'responsavel'], {
    required_error: 'Por favor, selecione seu perfil',
  }),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Digite um e-mail válido'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'A senha deve conter pelo menos um caractere especial'),
})

type SignupFormValues = z.infer<typeof signupSchema>

const ROLES = [
  {
    id: 'responsavel',
    label: 'Pai/Mãe',
    icon: Users,
    color: 'purple',
    classes: {
      selected: 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500',
      hover: 'hover:border-purple-200 hover:bg-purple-50/50',
      icon: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      focus: 'focus-visible:ring-purple-600',
    },
  },
  {
    id: 'professor',
    label: 'Professor',
    icon: GraduationCap,
    color: 'blue',
    classes: {
      selected: 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500',
      hover: 'hover:border-blue-200 hover:bg-blue-50/50',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      focus: 'focus-visible:ring-blue-600',
    },
  },
  {
    id: 'student',
    label: 'Estudante',
    icon: Book,
    color: 'orange',
    classes: {
      selected: 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500',
      hover: 'hover:border-orange-200 hover:bg-orange-50/50',
      icon: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
      focus: 'focus-visible:ring-orange-600',
    },
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: Users,
    color: 'green',
    classes: {
      selected: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500',
      hover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
      icon: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      focus: 'focus-visible:ring-emerald-600',
    },
  },
] as const

type RoleId = (typeof ROLES)[number]['id']

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp, user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/home')
    }
  }, [user, navigate])

  const initialRole = searchParams.get('role') as RoleId | undefined

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: initialRole,
      name: '',
      email: '',
      password: '',
    },
  })

  const selectedRole = form.watch('role') as RoleId | undefined
  const passwordValue = form.watch('password') || ''

  const activeTheme = useMemo(() => {
    if (!selectedRole) return null
    return ROLES.find((r) => r.id === selectedRole)
  }, [selectedRole])

  const passwordStrength = useMemo(() => {
    let score = 0
    if (!passwordValue) return score
    if (passwordValue.length >= 8) score += 1
    if (/[0-9]/.test(passwordValue)) score += 1
    if (/[^a-zA-Z0-9]/.test(passwordValue)) score += 1
    return score
  }, [passwordValue])

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    const { error } = await signUp({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
    })
    setIsLoading(false)

    if (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as any, { message })
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar conta',
          description: getErrorMessage(error),
        })
      }
      return
    }

    toast({
      title: 'Conta criada com sucesso!',
      description: `Bem-vindo ao Helpme Study, ${data.name.split(' ')[0]}!`,
    })
    navigate('/home')
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto pt-8 pb-12 font-sans">
      <div className="mb-6 animate-fade-in-down hidden sm:block">
        <img
          src={logoImg}
          alt="Help me study Logo"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-full shadow-lg border-4 border-white"
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
            Criar Conta
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Junte-se à nossa comunidade!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-slate-700 font-semibold">
                      Selecione seu perfil
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {ROLES.map((role) => {
                          const isSelected = field.value === role.id
                          const Icon = role.icon
                          return (
                            <div
                              key={role.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => field.onChange(role.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  field.onChange(role.id)
                                }
                              }}
                              className={cn(
                                'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                                isSelected
                                  ? role.classes.selected
                                  : `border-slate-100 bg-slate-50 text-slate-500 ${role.classes.hover}`,
                              )}
                            >
                              <Icon
                                className={cn(
                                  'mb-1 h-6 w-6 transition-colors',
                                  isSelected ? role.classes.icon : 'text-slate-400',
                                )}
                              />
                              <span className="text-[11px] sm:text-xs font-bold">{role.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Info */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Nome Completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                          <Input
                            placeholder="João da Silva"
                            className={cn(
                              'pl-10 h-11 rounded-xl bg-slate-50 border-slate-200',
                              activeTheme?.classes.focus || 'focus-visible:ring-indigo-600',
                            )}
                            autoComplete="name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="nome@exemplo.com"
                            className={cn(
                              'pl-10 h-11 rounded-xl bg-slate-50 border-slate-200',
                              activeTheme?.classes.focus || 'focus-visible:ring-indigo-600',
                            )}
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

                {/* Password Fields */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            className={cn(
                              'pl-10 pr-10 h-11 rounded-xl bg-slate-50 border-slate-200',
                              activeTheme?.classes.focus || 'focus-visible:ring-indigo-600',
                            )}
                            autoComplete="new-password"
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

                      {/* Password Strength Indicator */}
                      {passwordValue.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {[1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className={cn(
                                'h-1.5 w-full rounded-full transition-colors duration-300',
                                step <= passwordStrength
                                  ? passwordStrength === 1
                                    ? 'bg-red-500'
                                    : passwordStrength === 2
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  : 'bg-slate-200',
                              )}
                            />
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className={cn(
                  'w-full h-12 text-base font-bold rounded-xl mt-2 transition-colors duration-300',
                  activeTheme
                    ? activeTheme.classes.button
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 pb-6 bg-slate-50/50 border-t border-slate-100">
          <div className="text-center text-sm text-slate-600 font-medium">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className={cn(
                'font-bold transition-colors',
                activeTheme ? activeTheme.classes.icon : 'text-indigo-600 hover:text-indigo-500',
              )}
            >
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
