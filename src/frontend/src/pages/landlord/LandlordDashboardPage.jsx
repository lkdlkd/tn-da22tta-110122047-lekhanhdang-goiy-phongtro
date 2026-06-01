import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Home,
  MessageCircle,
  Pencil,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { getAppointmentsApi, cancelAppointmentApi, confirmAppointmentApi } from '@/services/appointmentService'
import { getConversationsApi } from '@/services/chatService'
import { getMyRoomsApi } from '@/services/roomService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LandlordContent,
  LandlordMetricCard,
  LandlordPageHeader,
  StatusBadge,
} from './components/LandlordUI'
import { cn } from '@/lib/utils'

dayjs.locale('vi')

const TIME_SLOT_LABELS = {
  morning: 'Sáng (8h-12h)',
  afternoon: 'Chiều (13h-17h)',
  evening: 'Tối (18h-20h)',
}

function formatCurrency(value) {
  if (!value) return 'Đang cập nhật'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">{children}</CardContent>
    </Card>
  )
}

function QuickAction({ icon: Icon, label, description, to }) {
  return (
    <Link to={to} className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-5">{label}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function InlineEmpty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default function LandlordDashboardPage() {
  const user = useSelector((state) => state.auth?.user)
  const navigate = useNavigate()

  const [rooms, setRooms] = useState([])
  const [appointments, setAppointments] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState('')

  useEffect(() => {
    Promise.all([getMyRoomsApi(), getAppointmentsApi(), getConversationsApi()])
      .then(([roomsRes, apptRes, convRes]) => {
        setRooms(roomsRes.data?.data?.rooms || [])
        setAppointments(apptRes.data?.data?.appointments || [])
        setConversations(convRes.data?.data?.conversations || [])
      })
      .catch(() => toast.error('Không thể tải dữ liệu dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return {
      totalRooms: rooms.length,
      availableRooms: rooms.filter((room) => room.isAvailable && room.status === 'approved').length,
      pendingRooms: rooms.filter((room) => room.status === 'pending').length,
      issueRooms: rooms.filter((room) => room.status === 'flagged' || room.status === 'rejected').length,
      totalViews: rooms.reduce((sum, room) => sum + (room.viewCount || 0), 0),
      pendingAppts: appointments.filter((appt) => appt.status === 'pending').length,
      todayAppts: appointments.filter((appt) =>
        ['pending', 'confirmed'].includes(appt.status) &&
        dayjs(appt.date).format('YYYY-MM-DD') === today
      ).length,
      unread: conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0),
    }
  }, [rooms, appointments, conversations])

  const pendingAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        if (appt.status !== 'pending') return false
        const createdByUserId = appt.createdBy?._id || appt.createdBy
        const isStudentCreator = !createdByUserId || String(createdByUserId) === String(appt.student?._id || appt.student)
        return isStudentCreator
      })
      .slice(0, 5)
  }, [appointments])

  const topRooms = useMemo(
    () => [...rooms].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 4),
    [rooms]
  )

  const confirmAppointment = async (id) => {
    setActionId(id)
    try {
      const res = await confirmAppointmentApi(id)
      const updated = res.data?.data?.appointment
      setAppointments((prev) => prev.map((appt) => appt._id === id ? { ...appt, ...updated } : appt))
      toast.success('Đã xác nhận lịch hẹn')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận lịch hẹn')
    } finally {
      setActionId('')
    }
  }

  const cancelAppointment = async (id) => {
    setActionId(id)
    try {
      const res = await cancelAppointmentApi(id, '')
      const updated = res.data?.data?.appointment
      setAppointments((prev) => prev.map((appt) => appt._id === id ? { ...appt, ...updated } : appt))
      toast.success('Đã huỷ lịch hẹn')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể huỷ lịch hẹn')
    } finally {
      setActionId('')
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <LandlordPageHeader
        title={`Xin chào${user?.name ? `, ${user.name.split(' ').pop()}` : ''}`}
        description="Tổng quan phòng trọ, lịch xem phòng và tin nhắn cần phản hồi."
        icon={Home}
        action={(
          <Button asChild className="h-9 rounded-lg">
            <Link to="/landlord/rooms/create">
              <Plus className="h-4 w-4" />
              Đăng phòng
            </Link>
          </Button>
        )}
      />

      <LandlordContent>
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
              <LandlordMetricCard icon={Home} label="Phòng đang quản lý" value={stats.totalRooms} description={`${stats.availableRooms} phòng còn trống`} href="/landlord/rooms" tone="blue" />
              <LandlordMetricCard icon={Calendar} label="Lịch chờ xác nhận" value={stats.pendingAppts} description={`${stats.todayAppts} lịch trong hôm nay`} href="/landlord/appointments" tone={stats.pendingAppts ? 'amber' : 'emerald'} urgent={stats.pendingAppts > 0} />
              <LandlordMetricCard icon={MessageCircle} label="Tin nhắn chưa đọc" value={stats.unread} description="Từ sinh viên quan tâm phòng" href="/messages" tone="violet" urgent={stats.unread > 0} />
              <LandlordMetricCard icon={TrendingUp} label="Tổng lượt xem" value={stats.totalViews.toLocaleString('vi-VN')} description={`${stats.pendingRooms + stats.issueRooms} tin cần theo dõi`} tone={stats.issueRooms ? 'red' : 'emerald'} />
            </>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <QuickAction icon={Plus} label="Đăng phòng mới" description="Tạo tin đăng với ảnh, tiện ích và vị trí bản đồ." to="/landlord/rooms/create" />
          <QuickAction icon={Home} label="Quản lý phòng" description="Cập nhật trạng thái, chỉnh sửa và kiểm tra tin duyệt." to="/landlord/rooms" />
          <QuickAction icon={MessageCircle} label="Mở tin nhắn" description="Phản hồi sinh viên đang hỏi về phòng trọ." to="/messages" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard
            title="Lịch hẹn chờ xác nhận"
            icon={Clock}
            action={<Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" asChild><Link to="/landlord/appointments">Xem tất cả</Link></Button>}
          >
            {loading ? (
              [0, 1, 2].map((item) => <Skeleton key={item} className="h-20 rounded-lg" />)
            ) : pendingAppointments.length === 0 ? (
              <InlineEmpty icon={CheckCircle} title="Không có lịch đang chờ" description="Các lịch mới cần xác nhận sẽ xuất hiện tại đây." />
            ) : pendingAppointments.map((appt) => (
              <div key={appt._id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{appt.room?.title || 'Phòng trọ'}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {appt.student?.name || 'Sinh viên'} · {dayjs(appt.date).format('DD/MM/YYYY')} · {TIME_SLOT_LABELS[appt.timeSlot] || appt.timeSlot}
                    </p>
                  </div>
                  <StatusBadge status="pending" type="appointment" compact />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-xs hover:bg-emerald-700" disabled={actionId === appt._id} onClick={() => confirmAppointment(appt._id)}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Xác nhận
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => navigate(`/messages?to=${appt.student?._id}`)}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    Nhắn tin
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs text-red-600 hover:text-red-700" disabled={actionId === appt._id} onClick={() => cancelAppointment(appt._id)}>
                    Huỷ
                  </Button>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Phòng được quan tâm"
            icon={TrendingUp}
            action={<Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" asChild><Link to="/landlord/rooms">Quản lý</Link></Button>}
          >
            {loading ? (
              [0, 1, 2].map((item) => <Skeleton key={item} className="h-16 rounded-lg" />)
            ) : topRooms.length === 0 ? (
              <InlineEmpty icon={Home} title="Chưa có phòng nào" description="Đăng phòng đầu tiên để bắt đầu nhận lượt xem." />
            ) : topRooms.map((room) => (
              <div key={room._id} className="flex gap-3 rounded-lg border p-3">
                {room.images?.[0] ? (
                  <img src={room.images[0]} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Home className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{room.title}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">{formatCurrency(room.price)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={room.isAvailable ? 'available' : 'rented'} type="availability" compact />
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {(room.viewCount || 0).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" asChild>
                    <Link to={`/rooms/${room.slug}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" asChild>
                    <Link to={`/landlord/rooms/${room._id}/edit`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard
            title="Tin nhắn gần đây"
            icon={MessageCircle}
            action={<Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" asChild><Link to="/messages">Mở chat</Link></Button>}
          >
            {loading ? (
              [0, 1, 2].map((item) => <Skeleton key={item} className="h-12 rounded-lg" />)
            ) : conversations.length === 0 ? (
              <InlineEmpty icon={MessageCircle} title="Chưa có tin nhắn" description="Tin nhắn từ sinh viên sẽ hiển thị ở đây." />
            ) : conversations.slice(0, 5).map((conv) => {
              const other = conv.participants?.find((person) => String(person._id) !== String(user?._id))
              const unread = conv.unreadCount || 0
              return (
                <Link key={conv._id} to="/messages" className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted">
                  {other?.avatar ? (
                    <img src={other.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {other?.name?.[0] || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn('line-clamp-1 text-sm', unread ? 'font-bold' : 'font-medium')}>{other?.name || 'Người dùng'}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{conv.lastMessage?.content || 'Chưa có tin nhắn'}</p>
                  </div>
                  {unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{unread}</span>}
                </Link>
              )
            })}
          </SectionCard>

          <SectionCard title="Cần chú ý" icon={AlertTriangle}>
            {loading ? (
              [0, 1, 2].map((item) => <Skeleton key={item} className="h-14 rounded-lg" />)
            ) : (
              <div className="space-y-2">
                {stats.pendingRooms > 0 && (
                  <Link to="/landlord/rooms" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 transition-colors hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{stats.pendingRooms} phòng đang chờ duyệt</p>
                      <p className="mt-0.5 text-xs leading-5 opacity-80">Tin chờ duyệt chưa hiển thị với sinh viên.</p>
                    </div>
                  </Link>
                )}
                {stats.issueRooms > 0 && (
                  <Link to="/landlord/rooms" className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{stats.issueRooms} phòng bị từ chối hoặc vi phạm</p>
                      <p className="mt-0.5 text-xs leading-5 opacity-80">Kiểm tra nội dung và cập nhật lại tin đăng.</p>
                    </div>
                  </Link>
                )}
                {stats.pendingAppts > 0 && (
                  <Link to="/landlord/appointments" className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 transition-colors hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{stats.pendingAppts} lịch cần xác nhận</p>
                      <p className="mt-0.5 text-xs leading-5 opacity-80">Phản hồi sớm giúp sinh viên chủ động thời gian xem phòng.</p>
                    </div>
                  </Link>
                )}
                {stats.pendingRooms === 0 && stats.issueRooms === 0 && stats.pendingAppts === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CheckCircle className="h-9 w-9 text-emerald-500" />
                    <p className="text-sm text-muted-foreground">Không có việc khẩn cần xử lý.</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </LandlordContent>
    </div>
  )
}
