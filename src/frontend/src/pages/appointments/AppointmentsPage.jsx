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

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/40">
      <CardContent className="grid gap-0 p-0 md:grid-cols-[220px_1fr]">
        <button
          type="button"
          className="relative aspect-[16/10] bg-muted text-left md:aspect-auto"
          onClick={() => room?.slug && navigate(`/rooms/${room.slug}`)}
        >
          {roomImage ? (
            <img src={roomImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Home className="h-8 w-8" />
            </div>
          )}
        </button>

        <div className="min-w-0 space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => room?.slug && navigate(`/rooms/${room.slug}`)}
                className="flex max-w-full items-center gap-1 text-left font-semibold hover:text-primary"
              >
                <span className="line-clamp-1">{room?.title || 'Phòng trọ'}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
            <StatusBadge status={appointment.status} type="appointment" />
          </div>

          {formatAddress(room?.address) && (
            <p className="flex items-start gap-1.5 text-sm leading-6 text-muted-foreground">
              <MapPin className="mt-1 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{formatAddress(room.address)}</span>
            </p>
          )}

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isLandlord ? 'Sinh viên' : 'Chủ trọ'}
                </p>
                <p className="line-clamp-1 text-sm font-semibold">{counterpart?.name || 'Chưa có tên'}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground sm:text-right">
              {counterpart?.phone && <p>{counterpart.phone}</p>}
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
              {appointment.note && <p>Ghi chú: {appointment.note}</p>}
              {appointment.cancelReason && <p>Lý do hủy: {appointment.cancelReason}</p>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            {isLandlord && appointment.status === 'pending' && (
              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-xs hover:bg-emerald-700" disabled={busy} onClick={() => onConfirm(appointment._id)}>
                <CheckCircle className="h-3.5 w-3.5" />
                Xác nhận
              </Button>
            )}
            {isLandlord && appointment.status === 'confirmed' && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled={busy} onClick={() => onComplete(appointment._id)}>
                <CheckCheck className="h-3.5 w-3.5" />
                Hoàn thành
              </Button>
            )}
            {isLandlord && appointment.student?._id && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => onMessage(appointment.student._id)}>
                <MessageCircle className="h-3.5 w-3.5" />
                Nhắn tin
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="ghost" className="ml-auto h-8 rounded-lg text-xs text-red-600 hover:text-red-700" disabled={busy} onClick={() => onCancel(appointment)}>
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
  const isLandlord = user?.role === 'landlord' || user?.role === 'admin'

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
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

  const filteredAppointments = useMemo(
    () => activeTab === 'all' ? appointments : appointments.filter((appointment) => appointment.status === activeTab),
    [appointments, activeTab]
  )

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
