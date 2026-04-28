import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { TudorMascot } from './TudorMascot'
import { cn } from '@/lib/utils'
import { useLocation } from 'react-router-dom'

interface Step {
  targetId: string | null
  text: string
  align: 'center' | 'bottom' | 'center-spotlight'
}

const steps: Step[] = [
  {
    targetId: null,
    text: 'Olá, eu sou o Tudor! Seja bem-vindo ao Help Me Study! Vou te guiar num tour rápido pela plataforma.',
    align: 'center',
  },
  {
    targetId: 'tutorial-wallet',
    text: 'Aqui fica o seu saldo! Você ganha Helps ensinando e usa para agendar monitorias.',
    align: 'bottom',
  },
  {
    targetId: 'tutorial-agendamentos',
    text: 'Nesta aba você pode gerenciar todos os seus Agendamentos e marcar novos horários.',
    align: 'bottom',
  },
  {
    targetId: 'tutorial-chat',
    text: 'No Chat, você conversa com a comunidade, tira dúvidas e combina detalhes das aulas.',
    align: 'bottom',
  },
  {
    targetId: 'tutorial-profile',
    text: 'No seu Perfil, você pode alterar foto, bio, disciplinas que domina e sair da conta.',
    align: 'bottom',
  },
  {
    targetId: 'tutorial-content',
    text: 'E aqui na área principal você vê seu resumo, agenda e tudo que precisa para focar nos estudos! Aproveite!',
    align: 'center-spotlight',
  },
]

export function TudorTutorial() {
  const { user } = useAuth()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (user && user.tutorial_visto === false && location.pathname === '/home') {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user, location.pathname])

  useEffect(() => {
    if (!isVisible) return

    const updateRect = () => {
      const step = steps[currentStep]
      if (step.targetId) {
        const el = document.getElementById(step.targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          setTimeout(() => {
            const rect = el.getBoundingClientRect()
            setTargetRect(rect)
          }, 300)
        } else {
          setTargetRect(null)
        }
      } else {
        setTargetRect(null)
      }
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [currentStep, isVisible])

  const finishTutorial = async () => {
    setIsVisible(false)
    if (user && user.tutorial_visto === false) {
      try {
        await pb.collection('users').update(user.id, { tutorial_visto: true })
      } catch (err) {
        console.error('Failed to update tutorial status', err)
      }
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      finishTutorial()
    }
  }

  if (!isVisible) return null

  const step = steps[currentStep]
  const isCenter = step.align === 'center'
  const isCenterSpotlight = step.align === 'center-spotlight'
  const isCircle = isCenter || (targetRect && Math.abs(targetRect.width - targetRect.height) < 30)

  const spotlightStyle =
    isCenter || (!targetRect && !isCenterSpotlight)
      ? {
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
          top: '50%',
          left: '50%',
          width: 0,
          height: 0,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
        }
      : {
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
          top: targetRect!.top - 10,
          left: targetRect!.left - 10,
          width: targetRect!.width + 20,
          height: targetRect!.height + 20,
          borderRadius: isCircle ? '50%' : '16px',
          transition: 'all 0.4s ease-in-out',
        }

  let mascotContainerStyle: React.CSSProperties = {}
  let balloonClass = ''

  if (isCenter || isCenterSpotlight || !targetRect) {
    mascotContainerStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }
    balloonClass = 'mt-4'
  } else {
    mascotContainerStyle = {
      top: targetRect.bottom + 20,
      left: Math.max(
        10,
        Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 330),
      ),
      flexDirection: 'column',
      alignItems: 'center',
    }
    balloonClass = 'mt-4'
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-auto overflow-hidden font-sans">
      <div className="absolute pointer-events-none" style={spotlightStyle} />

      <div
        className="absolute flex w-[300px] sm:w-[320px] transition-all duration-400 ease-in-out"
        style={mascotContainerStyle}
      >
        <TudorMascot className="drop-shadow-2xl" pointing={!isCenter && !isCenterSpotlight} />

        <div
          className={cn(
            'bg-white p-5 rounded-2xl shadow-2xl relative border-2 border-indigo-100',
            balloonClass,
          )}
        >
          {step.align === 'bottom' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-l-2 border-t-2 border-indigo-100 rotate-45" />
          )}
          {(isCenter || isCenterSpotlight) && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-l-2 border-t-2 border-indigo-100 rotate-45" />
          )}

          <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed relative z-10">
            {step.text}
          </p>

          <div className="flex items-center justify-between mt-5 relative z-10 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={finishTutorial}
              className="text-slate-500 hover:text-slate-800 h-8 px-2"
            >
              Pular tutorial
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 h-8 px-4"
            >
              {currentStep === steps.length - 1 ? 'Começar!' : 'Próximo'}
            </Button>
          </div>

          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === currentStep ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-200',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
