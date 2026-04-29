import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Login from './pages/Login'
import Register from './pages/Register'
import Index from './pages/Index'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Agendamentos from './pages/Agendamentos'
import GestaoAgendamentos from './pages/GestaoAgendamentos'
import Checkout from './pages/Checkout'
import GestaoLider from './pages/GestaoLider'
import Profile from './pages/Profile'
import BuscarMonitores from './pages/BuscarMonitores'
import TermosDeUso from './pages/TermosDeUso'
import Layout from './components/Layout'
import Chat from './pages/Chat'
import { AuthProvider } from './hooks/use-auth'
import { AdminRoute } from './components/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout/:type/:id?" element={<Checkout />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/gestao-agendamentos" element={<GestaoAgendamentos />} />
            <Route path="/gestao-lider" element={<GestaoLider />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/monitores/busca" element={<BuscarMonitores />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/chat" element={<Chat />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
