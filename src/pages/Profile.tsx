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
import { Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const SUBJECTS_LIST = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Literature',
  'History',
  'Geography',
  'Computer Science',
  'Languages',
]

const DAYS = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' },
]

type AvailabilityMap = Record<string, { start: string; end: string }>

export default function Profile() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [profileId, setProfileId] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [availability, setAvailability] = useState<AvailabilityMap>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadProfile() {
      try {
        const profile = await getProfileByUserId(user.id)
        setProfileId(profile.id)
        setBio(profile.bio || '')

        const subjectsList = profile.subjects
          ? profile.subjects
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []
        setSelectedSubjects(subjectsList)

        if (profile.availability) {
          try {
            setAvailability(JSON.parse(profile.availability))
          } catch (e) {
            setAvailability({})
          }
        }
      } catch (err: any) {
        if (err.status !== 404) {
          toast({
            title: 'Error loading profile',
            description: getErrorMessage(err),
            variant: 'destructive',
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, toast])

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
      if (newAvail[dayId]) {
        delete newAvail[dayId]
      } else {
        newAvail[dayId] = { start: '09:00', end: '17:00' }
      }
      return newAvail
    })
  }

  const updateTime = (dayId: string, field: 'start' | 'end', value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }))
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-md border">
              {SUBJECTS_LIST.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject}`}
                    checked={selectedSubjects.includes(subject)}
                    onCheckedChange={() => toggleSubject(subject)}
                  />
                  <Label
                    htmlFor={`subject-${subject}`}
                    className="font-normal cursor-pointer leading-none"
                  >
                    {subject}
                  </Label>
                </div>
              ))}
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
                        <div className="flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-200">
                          <Input
                            type="time"
                            className="w-[120px] h-9"
                            value={availability[day.id].start}
                            onChange={(e) => updateTime(day.id, 'start', e.target.value)}
                          />
                          <span className="text-muted-foreground text-sm font-medium px-1">to</span>
                          <Input
                            type="time"
                            className="w-[120px] h-9"
                            value={availability[day.id].end}
                            onChange={(e) => updateTime(day.id, 'end', e.target.value)}
                          />
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
