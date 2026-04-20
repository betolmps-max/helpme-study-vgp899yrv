import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'
import logoImg from '@/assets/adapta-image-1776703638057-8b530.png'

export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      navigate('/home')
    }
  }, [user, loading, navigate])

  if (loading) return null

  const roles = [
    {
      id: 'responsavel',
      label: 'Sou pai/mãe',
      img: 'https://img.usecurling.com/i?q=house&shape=lineal-color',
    },
    {
      id: 'professor',
      label: 'Sou professor',
      img: 'https://img.usecurling.com/i?q=apple&shape=lineal-color',
    },
    {
      id: 'student',
      label: 'Sou aluno(a)',
      img: 'https://img.usecurling.com/i?q=backpack&shape=lineal-color',
    },
    {
      id: 'monitor',
      label: 'Sou líder escolar',
      img: 'https://img.usecurling.com/i?q=medal&shape=lineal-color',
    },
  ]

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full max-w-md mx-auto px-4 py-6 font-sans">
      <div className="flex justify-end w-full mb-8">
        <Button
          variant="secondary"
          className="rounded-full bg-[#f3e8ff] text-[#4c1d95] hover:bg-[#e9d5ff] font-bold px-6 py-5 text-base shadow-none border-0"
          onClick={() => navigate('/login')}
        >
          Entrar
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center w-full">
        <div className="mb-6 animate-fade-in-down">
          <img
            src={logoImg}
            alt="Help me study Logo"
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-full shadow-lg border-4 border-white"
          />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1c1c3c] mb-10 text-center tracking-tight animate-fade-in-up leading-tight">
          Help me study
        </h1>

        <div className="w-full space-y-4">
          {roles.map((role, idx) => (
            <button
              key={role.id}
              onClick={() => navigate(`/register?role=${role.id}`)}
              className="w-full flex items-center p-4 bg-white border-2 border-[#e6e8f4] rounded-3xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200 group active:scale-[0.98] animate-fade-in-up shadow-sm"
              style={{ animationDelay: `${150 + idx * 50}ms` }}
            >
              <div className="w-12 h-12 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shrink-0">
                <img src={role.img} alt={role.label} className="w-10 h-10 object-contain" />
              </div>
              <span className="text-xl font-bold text-[#1c1c3c] tracking-tight">{role.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
