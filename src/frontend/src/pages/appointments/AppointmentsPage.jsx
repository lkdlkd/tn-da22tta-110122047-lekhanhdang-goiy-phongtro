import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { toast } from 'sonner'
import {
  Calendar,
  CheckCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  Home,
  MapPin,
  MessageCircle,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import {
  cancelAppointmentApi,
  completeAppointmentApi,
  confirmAppointmentApi,
  getAppointmentsApi,
} from '@/services/appointmentService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  LandlordContent,
  LandlordEmptyState,
  LandlordMetricCard,
  LandlordPageHeader,
  LandlordTabs,
  StatusBadge,
} from '@/pages/landlord/components/LandlordUI'
import { cn } from '@/lib/utils'

dayjs.locale('vi')

const TIME_SLOT_LABELS = {
  morning: 'Sáng (8h-12h)',
  afternoon: 'Chiều (13h-17h)',
  evening: 'Tối (18h-20h)',
}

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

function formatAddress(address) {
  if (!address) return ''
  if (typeof address === 'string') return address
  return address.fullAddress || [address.street, address.ward, address.district, address.city].filter(Boolean).join(', ')
}

function AppointmentCard({ appointment, isLandlord, onConfirm, onComplete, onCancel, onMessage, busy }) {
  const navigate = useNavigate()
  const room = appointment.room
  const roomImage = room?.images?.[0]
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed'
  const counterpart = isLandlord ? appointment.student : appointment.landlord

  const createdByUserId = appointment.createdBy?._id || appointment.createdBy
  const isLandlordCreator = createdByUserId && String(createdByUserId) === String(appointment.landlord?._id || appointment.landlord)
  const isStudentCreator = !createdByUserId || String(createdByUserId) === String(appointment.student?._id || appointment.student)
  const showConfirmButton = appointment.status === 'pending' && (isLandlord ? !isLandlordCreator : !isStudentCreator)

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/45">
      <CardContent className="grid gap-0 p-0 md:grid-cols-[220px_1fr]">
        <button
          type="button"
          className="relative aspect-[16/10] w-full bg-muted text-left md:aspect-auto md:h-full flex items-stretch"
          onClick={() => room?.slug && navigate(`/rooms/${room.slug}`)}
        >
          {roomImage ? (
            <img src={roomImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted/40 min-h-[140px]">
              <Home className="h-8 w-8" />
            </div>
          )}
        </button>

        <div className="min-w-0 space-y-4 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => room?.slug && navigate(`/rooms/${room.slug}`)}
                  className="flex max-w-full items-center gap-1.5 text-left font-bold hover:text-primary transition-colors text-base"
                >
                  <span className="line-clamp-1">{room?.title || 'Phòng trọ'}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {dayjs(appointment.date).format('dddd, DD/MM/YYYY')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {TIME_SLOT_LABELS[appointment.timeSlot] || appointment.timeSlot}
                  </span>
                </div>
              </div>
              <div className="self-start sm:self-auto">
                <StatusBadge status={appointment.status} type="appointment" />
              </div>
            </div>

            {formatAddress(room?.address) && (
              <p className="flex items-start gap-1.5 text-sm leading-6 text-muted-foreground">
                <MapPin className="mt-1 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{formatAddress(room.address)}</span>
              </p>
            )}

            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                {counterpart?.avatar ? (
                  <img
                    src={counterpart.avatar}
                    alt={counterpart.name}
                    className="h-9 w-9 rounded-full object-cover border bg-background shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                    {(counterpart?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isLandlord ? 'Sinh viên' : 'Chủ trọ'}
                  </p>
                  <p className="line-clamp-1 text-sm font-bold">{counterpart?.name || 'Chưa có tên'}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right flex flex-col justify-center sm:items-end gap-0.5">
                {counterpart?.phone && <p className="font-medium">{counterpart.phone}</p>}
                {counterpart?.email && <p className="line-clamp-1">{counterpart.email}</p>}
              </div>
            </div>

            {(appointment.note || appointment.cancelReason) && (
              <div className={cn(
                'rounded-lg border px-3 py-2 text-sm leading-6',
                appointment.cancelReason
                  ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                  : 'bg-background text-muted-foreground'
              )}>
                {appointment.note && <p><span className="font-semibold text-foreground/80">Ghi chú:</span> {appointment.note}</p>}
                {appointment.cancelReason && <p><span className="font-semibold">Lý do hủy:</span> {appointment.cancelReason}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-3 mt-1">
            {showConfirmButton && (
              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-xs hover:bg-emerald-700 font-bold" disabled={busy} onClick={() => onConfirm(appointment._id)}>
                <CheckCircle className="h-3.5 w-3.5" />
                Xác nhận
              </Button>
            )}
            {appointment.status === 'confirmed' && (
              <Button size="sm" className="h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold" disabled={busy} onClick={() => onComplete(appointment._id)}>
                <CheckCheck className="h-3.5 w-3.5" />
                Hoàn thành
              </Button>
            )}
            {appointment.student?._id && appointment.landlord?._id && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold" onClick={() => onMessage(isLandlord ? appointment.student._id : appointment.landlord._id)}>
                <MessageCircle className="h-3.5 w-3.5" />
                Nhắn tin
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="ghost" className="ml-auto h-8 rounded-lg text-xs text-red-600 hover:text-red-700 font-semibold" disabled={busy} onClick={() => onCancel(appointment)}>
                <XCircle className="h-3.5 w-3.5" />
                Hủy lịch
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AppointmentsPage() {
  const user = useSelector((state) => state.auth?.user)
  const navigate = useNavigate()
  const isLandlord = window.location.pathname.startsWith('/landlord')

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'thisWeek'
  const [sortBy, setSortBy] = useState('desc') // 'desc', 'asc'
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionId, setActionId] = useState('')

  useEffect(() => {
    getAppointmentsApi()
      .then((res) => setAppointments(res.data?.data?.appointments || []))
      .catch(() => toast.error('Không thể tải lịch hẹn'))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const result = { all: appointments.length }
    appointments.forEach((appointment) => {
      result[appointment.status] = (result[appointment.status] || 0) + 1
    })
    return result
  }, [appointments])

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return {
      pending: appointments.filter((appt) => appt.status === 'pending').length,
      confirmed: appointments.filter((appt) => appt.status === 'confirmed').length,
      today: appointments.filter((appt) =>
        ['pending', 'confirmed'].includes(appt.status) &&
        dayjs(appt.date).format('YYYY-MM-DD') === today
      ).length,
      total: appointments.length,
    }
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // 1. Status Filter
      const matchesTab = activeTab === 'all' || appt.status === activeTab

      // 2. Search Filter
      const roomTitle = appt.room?.title || ''
      const counterpartName = (isLandlord ? appt.student?.name : appt.landlord?.name) || ''
      const counterpartPhone = (isLandlord ? appt.student?.phone : appt.landlord?.phone) || ''
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        roomTitle.toLowerCase().includes(query) ||
        counterpartName.toLowerCase().includes(query) ||
        counterpartPhone.includes(query)

      // 3. Date Filter
      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = dayjs(appt.date).isSame(dayjs(), 'day')
      } else if (dateFilter === 'thisWeek') {
        const startOfWeek = dayjs().startOf('week')
        const endOfWeek = dayjs().endOf('week')
        const apptDate = dayjs(appt.date)
        matchesDate = apptDate.isAfter(startOfWeek.subtract(1, 'day')) && apptDate.isBefore(endOfWeek.add(1, 'day'))
      }

      return matchesTab && matchesSearch && matchesDate
    }).sort((a, b) => {
      const timeA = dayjs(a.date).valueOf()
      const timeB = dayjs(b.date).valueOf()
      return sortBy === 'desc' ? timeB - timeA : timeA - timeB
    })
  }, [appointments, activeTab, searchQuery, dateFilter, sortBy, isLandlord])

  const updateAppointment = (updated) => {
    setAppointments((prev) => prev.map((appointment) => appointment._id === updated._id ? { ...appointment, ...updated } : appointment))
  }

  const doAction = async (fn, id, successMessage) => {
    setActionId(id)
    try {
      const res = await fn(id)
      updateAppointment(res.data?.data?.appointment || { _id: id })
      toast.success(successMessage)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionId('')
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setActionId(cancelTarget._id)
    try {
      const res = await cancelAppointmentApi(cancelTarget._id, cancelReason)
      updateAppointment(res.data?.data?.appointment || { _id: cancelTarget._id })
      toast.success('Đã hủy lịch hẹn')
      setCancelTarget(null)
      setCancelReason('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionId('')
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <LandlordPageHeader
        title={isLandlord ? 'Quản lý lịch hẹn' : 'Lịch hẹn xem phòng'}
        description={isLandlord ? 'Xác nhận lịch xem phòng, hoàn thành buổi hẹn và liên hệ sinh viên.' : 'Theo dõi các lịch xem phòng bạn đã đặt.'}
        icon={Calendar}
      />

      <LandlordContent className="max-w-6xl">
        {isLandlord && (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {loading ? [0, 1, 2, 3].map((item) => (
              <Card key={item}>
                <CardContent className="flex items-center gap-4 p-5">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                </CardContent>
              </Card>
            )) : (
              <>
                <LandlordMetricCard icon={Clock} label="Chờ xác nhận" value={stats.pending} description="Lịch mới cần phản hồi" tone={stats.pending ? 'amber' : 'emerald'} urgent={stats.pending > 0} />
                <LandlordMetricCard icon={CheckCircle} label="Đã xác nhận" value={stats.confirmed} description="Sẵn sàng xem phòng" tone="blue" />
                <LandlordMetricCard icon={Calendar} label="Lịch hôm nay" value={stats.today} description="Đang chờ hoặc đã xác nhận" tone="violet" />
                <LandlordMetricCard icon={Calendar} label="Tổng lịch" value={stats.total} description="Tất cả trạng thái" tone="slate" />
              </>
            )}
          </div>
        )}

        <LandlordTabs
          value={activeTab}
          onChange={setActiveTab}
          items={TABS.map((tab) => ({ ...tab, count: counts[tab.value] || 0 }))}
        />

        {/* Filter Section */}
        <div className="space-y-3 p-4 rounded-xl border bg-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo phòng trọ, tên, số điện thoại..."
                className="pl-9 rounded-xl h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Date Quick Filter & Sort dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[140px]"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="thisWeek">Tuần này</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[140px]"
              >
                <option value="desc">Mới nhất trước</option>
                <option value="asc">Cũ nhất trước</option>
              </select>

              {(searchQuery || dateFilter !== 'all' || sortBy !== 'desc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setDateFilter('all')
                    setSortBy('desc')
                  }}
                  className="h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-48 rounded-lg" />)}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <LandlordEmptyState
            icon={Calendar}
            title={activeTab === 'all' ? 'Chưa có lịch hẹn nào' : `Không có lịch "${TABS.find((tab) => tab.value === activeTab)?.label}"`}
            description={isLandlord ? 'Khi sinh viên đặt lịch xem phòng, bạn có thể xác nhận ngay tại đây.' : 'Các lịch xem phòng đã đặt sẽ hiển thị tại đây.'}
          />
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                isLandlord={isLandlord}
                busy={actionId === appointment._id}
                onConfirm={(id) => doAction(confirmAppointmentApi, id, 'Đã xác nhận lịch hẹn')}
                onComplete={(id) => doAction(completeAppointmentApi, id, 'Đã đánh dấu hoàn thành')}
                onCancel={(appt) => {
                  setCancelTarget(appt)
                  setCancelReason('')
                }}
                onMessage={(studentId) => navigate(`/messages?to=${studentId}`)}
              />
            ))}
          </div>
        )}
      </LandlordContent>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => {
        if (!open) {
          setCancelTarget(null)
          setCancelReason('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch hẹn?</DialogTitle>
            <DialogDescription>
              Bạn có thể nhập lý do hủy để bên còn lại nắm thông tin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Lý do hủy lịch..."
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Đóng</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={Boolean(actionId)}>
              Hủy lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
