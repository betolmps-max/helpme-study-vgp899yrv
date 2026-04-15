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
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getDisciplinas, createDisciplina, type Disciplina } from '@/services/disciplinas'

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

export default function Profile() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [profileId, setProfileId] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [availability, setAvailability] = useState<AvailabilityMap>({})

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

        if (profileRes) {
          setProfileId(profileRes.id)
          setBio(profileRes.bio || '')

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Partial<ProfileType> = {
        user_id: user.id,
        bio,
        subjects: selectedSubjects.join(', '),
        availability: JSON.stringify(availability),
      }

      if (profileId) {
        await updateProfile(profileId, data)
      } else {
        const newProfile = await createProfile(data)
        setProfileId(newProfile.id)
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
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal information and academic preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
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
                                onChange={(e) => updateTime(day.id, index, 'start', e.target.value)}
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
