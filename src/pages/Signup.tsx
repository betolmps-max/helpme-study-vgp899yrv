import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  User,
  Users,
} from 'lucide-react'

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

const signupSchema = z
  .object({
    role: z.enum(['professor', 'monitor', 'student'], {
      required_error: 'Por favor, selecione seu perfil',
    }),
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Digite um e-mail válido'),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
      .regex(/[^a-zA-Z0-9]/, 'A senha deve conter pelo menos um caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

const ROLES = [
  {
    id: 'professor',
    label: 'Professor',
    icon: BookOpen,
    color: 'indigo',
    classes: {
      selected: 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600',
      hover: 'hover:border-indigo-200 hover:bg-indigo-50/50',
      icon: 'text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-600',
      focus: 'focus-visible:ring-indigo-600',
    },
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: Users,
    color: 'emerald',
    classes: {
      selected: 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600',
      hover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
      icon: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600',
      focus: 'focus-visible:ring-emerald-600',
    },
  },
  {
    id: 'student',
    label: 'Estudante',
    icon: GraduationCap,
    color: 'amber',
    classes: {
      selected: 'border-amber-600 bg-amber-50 text-amber-700 ring-1 ring-amber-600',
      hover: 'hover:border-amber-200 hover:bg-amber-50/50',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600',
      focus: 'focus-visible:ring-amber-600',
    },
  },
] as const

type RoleId = (typeof ROLES)[number]['id']

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)

    toast({
      title: 'Conta criada com sucesso!',
      description: `Bem-vindo à plataforma, ${data.name.split(' ')[0]}!`,
    })

    navigate('/')
  }

  return (
    <Card className="border-slate-200 shadow-elevation">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Criar Conta
        </CardTitle>
        <CardDescription className="text-slate-500">
          Junte-se à nossa plataforma educacional
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
                  <FormLabel className="text-slate-700">Selecione seu perfil</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-3">
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
                              'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                              isSelected
                                ? role.classes.selected
                                : `border-slate-100 bg-white text-slate-500 ${role.classes.hover}`,
                            )}
                          >
                            <Icon
                              className={cn(
                                'mb-2 h-6 w-6 transition-colors',
                                isSelected ? role.classes.icon : 'text-slate-400',
                              )}
                            />
                            <span className="text-xs font-semibold">{role.label}</span>
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
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Nome Completo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="João da Silva"
                          className={cn('pl-9', activeTheme?.classes.focus)}
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
                    <FormLabel className="text-slate-700">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="nome@exemplo.com"
                          className={cn('pl-9', activeTheme?.classes.focus)}
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
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            className={cn('pl-9 pr-9', activeTheme?.classes.focus)}
                            autoComplete="new-password"
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
                                'h-1 w-full rounded-full transition-colors duration-300',
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Confirmar Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Repita a senha"
                            className={cn('pl-9 pr-9', activeTheme?.classes.focus)}
                            autoComplete="new-password"
                            disabled={isLoading}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className={cn(
                'w-full transition-colors duration-300',
                activeTheme ? activeTheme.classes.button : 'bg-slate-900 hover:bg-slate-800',
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-slate-100">
        <div className="text-center text-sm text-slate-500">
          Já tem uma conta?{' '}
          <Link
            to="/"
            className={cn(
              'font-semibold transition-colors',
              activeTheme ? activeTheme.classes.icon : 'text-slate-900 hover:text-slate-700',
            )}
          >
            Fazer login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
