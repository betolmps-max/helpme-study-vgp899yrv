import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { getUsersList, getStaffUsers, updateUserAdminStatus } from '@/services/users'
import { getAppointmentsList } from '@/services/appointments'
import { Users, CalendarDays, Shield, ShieldOff, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { LocationsManager } from '@/components/admin/LocationsManager'

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [staffUsers, setStaffUsers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    try {
      const [usersData, staffData, apptsData] = await Promise.all([
        getUsersList(),
        getStaffUsers(searchTerm),
        getAppointmentsList(),
      ])
      setUsers(usersData)
      setStaffUsers(staffData)
      setAppointments(apptsData)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (loading) return
    const delayDebounceFn = setTimeout(() => {
      getStaffUsers(searchTerm)
        .then(setStaffUsers)
        .catch(() => {})
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, loading])

  useRealtime('users', () => {
    getUsersList().then(setUsers)
    getStaffUsers(searchTerm).then(setStaffUsers)
  })

  useRealtime('appointments', () => {
    getAppointmentsList().then(setAppointments)
  })

  const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
    try {
      await updateUserAdminStatus(id, !currentStatus)
      toast.success(`User admin status updated successfully.`)
    } catch (error) {
      toast.error('Failed to update user status.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage users and view platform statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle>Professors & Monitors</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={u.avatar ? pb.files.getURL(u, u.avatar) : ''}
                            alt={u.name}
                          />
                          <AvatarFallback>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-900">{u.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {u.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.is_admin ? (
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={u.is_admin ? 'destructive' : 'default'}
                        size="sm"
                        disabled={u.id === currentUser?.id}
                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                        className="w-[140px]"
                      >
                        {u.is_admin ? (
                          <>
                            <ShieldOff className="mr-2 h-4 w-4" /> Remove Admin
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" /> Make Admin
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {staffUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      {searchTerm
                        ? 'No professors or monitors match your search.'
                        : 'No professors or monitors found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LocationsManager />
    </div>
  )
}
