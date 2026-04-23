import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  getProfileByUserId,
  createProfile,
  updateProfile,
  type Profile as ProfileType,
} from '@/services/profiles'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Star } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getDisciplinas, createDisciplina, type Disciplina } from '@/services/disciplinas'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'

const DAYS = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' },
]

type TimeSlot = { start: string; end: string }
type AvailabilityMap = Record<string, TimeSlot[]>

import { WalletDialogs } from '@/components/wallet/WalletDialogs'
import { Coins } from 'lucide-react'
import useRealtime from '@/hooks/use-realtime'

export default function Profile() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [currentUser, setCurrentUser] = useState<any>(user)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [valorSessao, setValorSessao] = useState<number>(0)
  const [taxaUsoLocal, setTaxaUsoLocal] = useState<number>(0)

  useEffect(() => {
    if (user)
      pb.collection('users')
        .getOne(user.id)
        .then(setCurrentUser)
        .catch(() => {})
  }, [user])

  useRealtime('users', (e) => {
    if (e.action === 'update' && e.record.id === user?.id) {
      setCurrentUser(e.record)
    }
  })
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [availability, setAvailability] = useState<AvailabilityMap>({})
  const [maxParticipants, setMaxParticipants] = useState<number>(1)
  const [notificacoesEmail, setNotificacoesEmail] = useState<boolean>(true)

  const [subjectsList, setSubjectsList] = useState<Disciplina[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [addingSubject, setAddingSubject] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        const [profileRes, disciplinasRes] = await Promise.all([
          getProfileByUserId(user.id).catch((err) => {
            if (err.status !== 404) throw err
            return null
          }),
          getDisciplinas(),
        ])

        setSubjectsList(disciplinasRes)

        setNotificacoesEmail(user.notificacoes_email !== false)

        if (profileRes) {
          setProfileId(profileRes.id)
          setBio(profileRes.bio || '')
          setMaxParticipants(profileRes.max_participants || 1)
          setValorSessao(profileRes.valor_sessao || 0)
          setTaxaUsoLocal(profileRes.taxa_uso_local || 0)

          const userSubjects = profileRes.subjects
            ? profileRes.subjects
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : []
          setSelectedSubjects(userSubjects)

          if (profileRes.availability) {
            try {
              const parsed = JSON.parse(profileRes.availability)
              const newAvailability: AvailabilityMap = {}
              for (const key in parsed) {
                if (Array.isArray(parsed[key])) {
                  newAvailability[key] = parsed[key]
                } else if (parsed[key] && parsed[key].start) {
                  newAvailability[key] = [parsed[key]]
                }
              }
              setAvailability(newAvailability)
            } catch (e) {
              setAvailability({})
            }
          }
        }
      } catch (err: any) {
        toast({
          title: 'Error loading profile data',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return
    const exists = subjectsList.some(
      (s) => s.nome.toLowerCase() === newSubject.trim().toLowerCase(),
    )
    if (exists) {
      toast({ description: 'Discipline already exists' })
      return
    }
    setAddingSubject(true)
    try {
      const created = await createDisciplina(newSubject.trim())
      setSubjectsList((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)))
      setSelectedSubjects((prev) => [...prev, created.nome])
      setNewSubject('')
      toast({ description: 'Discipline added' })
    } catch (err) {
      toast({
        title: 'Error adding discipline',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setAddingSubject(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const isEducator = user.user_type === 'professor' || user.user_type === 'monitor'
  const isLiderEscolar = user.user_type === 'lider_escolar'

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Partial<ProfileType> = {
        user_id: user.id,
        bio,
        subjects: selectedSubjects.join(', '),
        availability: JSON.stringify(availability),
        ...(isEducator && { max_participants: maxParticipants, valor_sessao: valorSessao }),
        ...(isLiderEscolar && { taxa_uso_local: taxaUsoLocal }),
      }

      if (profileId) {
        await updateProfile(profileId, data)
      } else {
        const newProfile = await createProfile(data)
        setProfileId(newProfile.id)
      }

      if (user.notificacoes_email !== notificacoesEmail) {
        await pb.collection('users').update(user.id, { notificacoes_email: notificacoesEmail })
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      })
    } catch (err) {
      toast({
        title: 'Error saving profile',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    )
  }

  const toggleDay = (dayId: string) => {
    setAvailability((prev) => {
      const newAvail = { ...prev }
      if (newAvail[dayId] && newAvail[dayId].length > 0) {
        delete newAvail[dayId]
      } else {
        newAvail[dayId] = [{ start: '09:00', end: '17:00' }]
      }
      return newAvail
    })
  }

  const addTimeSlot = (dayId: string) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: [...(prev[dayId] || []), { start: '09:00', end: '17:00' }],
    }))
  }

  const removeTimeSlot = (dayId: string, index: number) => {
    setAvailability((prev) => {
      const slots = prev[dayId].filter((_, i) => i !== index)
      if (slots.length === 0) {
        const newAvail = { ...prev }
        delete newAvail[dayId]
        return newAvail
      }
      return { ...prev, [dayId]: slots }
    })
  }

  const updateTime = (dayId: string, index: number, field: 'start' | 'end', value: string) => {
    setAvailability((prev) => {
      const newSlots = [...prev[dayId]]
      newSlots[index] = { ...newSlots[index], [field]: value }
      return { ...prev, [dayId]: newSlots }
    })
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Card className="flex-1 bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Wallet (Helps)</p>
                <h3 className="text-2xl font-bold">
                  {currentUser?.saldo_helps?.toFixed(2) || '0.00'} HLP
                </h3>
              </div>
            </div>
            <WalletDialogs user={currentUser} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal information and academic preferences.
          </CardDescription>
          {currentUser && currentUser.total_avaliacoes > 0 && (
            <div className="flex items-center mt-3 p-3 bg-muted/30 rounded-md w-fit border">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-2" />
              <span className="font-semibold text-foreground text-lg mr-1">
                {currentUser.media_avaliacao?.toFixed(1) || '0.0'}
              </span>
              <span className="text-muted-foreground">
                ({currentUser.total_avaliacoes} avaliações)
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 rounded-md border p-4 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receba um alerta por e-mail quando tiver novas mensagens no chat.
              </p>
            </div>
            <Switch checked={notificacoesEmail} onCheckedChange={setNotificacoesEmail} />
          </div>

          {isLiderEscolar && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Taxa de Uso do Local</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Defina a porcentagem que será cobrada pelas sessões de estudo realizadas em seus
                locais.
              </p>
              <Select
                value={taxaUsoLocal.toString()}
                onValueChange={(val) => setTaxaUsoLocal(Number(val))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione a taxa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="bio">About Me</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a little bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="resize-none h-24"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {isEducator ? 'Subjects Taught' : 'Subjects I Need Help With'}
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="New subject..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSubject()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddSubject}
                disabled={addingSubject || !newSubject.trim()}
              >
                {addingSubject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Subject
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-md border">
              {subjectsList.length === 0 ? (
                <span className="text-sm text-muted-foreground col-span-full">
                  No subjects available. Add one above!
                </span>
              ) : (
                subjectsList.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjects.includes(subject.nome)}
                      onCheckedChange={() => toggleSubject(subject.nome)}
                    />
                    <Label
                      htmlFor={`subject-${subject.id}`}
                      className="font-normal cursor-pointer leading-none"
                    >
                      {subject.nome}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {isEducator && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Preço da Sessão (Helps)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={valorSessao}
                    onChange={(e) => setValorSessao(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    Helps por sessão (0 = Gratuito)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Students per Session</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxParticipants(num)}
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-sm sm:text-base font-medium transition-colors ${
                        maxParticipants === num
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Availability Scheduler</Label>
                <div className="space-y-2 rounded-md border p-4 bg-muted/30">
                  {DAYS.map((day) => {
                    const isEnabled = !!availability[day.id]
                    return (
                      <div
                        key={day.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-background border shadow-sm transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`day-${day.id}`}
                            checked={isEnabled}
                            onCheckedChange={() => toggleDay(day.id)}
                          />
                          <Label
                            htmlFor={`day-${day.id}`}
                            className="font-medium cursor-pointer w-24"
                          >
                            {day.label}
                          </Label>
                        </div>

                        {isEnabled && (
                          <div className="flex flex-col gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                            {availability[day.id].map((slot, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-200"
                              >
                                <Input
                                  type="time"
                                  className="w-[120px] h-9"
                                  value={slot.start}
                                  onChange={(e) =>
                                    updateTime(day.id, index, 'start', e.target.value)
                                  }
                                />
                                <span className="text-muted-foreground text-sm font-medium px-1">
                                  to
                                </span>
                                <Input
                                  type="time"
                                  className="w-[120px] h-9"
                                  value={slot.end}
                                  onChange={(e) => updateTime(day.id, index, 'end', e.target.value)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive"
                                  onClick={() => removeTimeSlot(day.id, index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => addTimeSlot(day.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6 bg-muted/10 rounded-b-lg">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
