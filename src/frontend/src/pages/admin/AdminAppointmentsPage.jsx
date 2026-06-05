import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { toast } from 'sonner'
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Home,
  MapPin,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import {
  cancelAppointmentApi,
  getAppointmentsApi,
} from '@/services/appointmentService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  AdminContent,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPagination,
  AdminTabs,
} from '@/pages/admin/components/AdminUI'
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

function StatusBadge({ status }) {
  const configs = {
    pending: { label: 'Chờ xác nhận', cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    confirmed: { label: 'Đã xác nhận', cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
    completed: { label: 'Hoàn thành', cls: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' },
    cancelled: { label: 'Đã hủy', cls: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  }
  const config = configs[status] || configs.pending
  return <Badge variant="outline" className={config.cls}>{config.label}</Badge>
}

export default function AdminAppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'thisWeek'
  const [sortBy, setSortBy] = useState('desc') // 'desc', 'asc'
  const [page, setPage] = useState(1)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionId, setActionId] = useState('')

  const LIMIT = 8

  const fetchAppointments = () => {
    setLoading(true)
    getAppointmentsApi()
      .then((res) => {
        setAppointments(res.data?.data?.appointments || [])
      })
      .catch(() => toast.error('Không thể tải danh sách lịch hẹn'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAppointments()
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

  // Filtered list based on status tab, search query, date, and sorting
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesTab = activeTab === 'all' || appt.status === activeTab

      const studentName = appt.student?.name || ''
      const landlordName = appt.landlord?.name || ''
      const roomTitle = appt.room?.title || ''
      const studentPhone = appt.student?.phone || ''
      const landlordPhone = appt.landlord?.phone || ''

      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        studentName.toLowerCase().includes(query) ||
        landlordName.toLowerCase().includes(query) ||
        roomTitle.toLowerCase().includes(query) ||
        studentPhone.includes(query) ||
        landlordPhone.includes(query)

      // Date filter
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
  }, [appointments, activeTab, searchQuery, dateFilter, sortBy])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [activeTab, searchQuery, dateFilter, sortBy])

  const totalPages = Math.ceil(filteredAppointments.length / LIMIT)
  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * LIMIT
    return filteredAppointments.slice(start, start + LIMIT)
  }, [filteredAppointments, page])

  const updateAppointment = (updated) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment._id === updated._id ? { ...appointment, ...updated } : appointment
      )
    )
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
    <>
      <AdminPageHeader
        title="Quản lý lịch hẹn"
        description="Theo dõi toàn bộ lịch hẹn xem phòng trọ của hệ thống và giải quyết các tranh chấp lịch hẹn nếu cần."
        icon={Calendar}
        meta={(
          <>
            <Badge variant="secondary">{stats.total} tổng số lịch hẹn</Badge>
            {stats.pending > 0 && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                {stats.pending} chờ xác nhận
              </Badge>
            )}
          </>
        )}
        onRefresh={fetchAppointments}
        refreshing={loading}
      />

      <AdminContent>
        {/* Statistics Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [0, 1, 2, 3].map((item) => (
              <Card key={item}>
                <CardContent className="flex items-center gap-4 p-5">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <AdminMetricCard icon={Clock} label="Chờ xác nhận" value={stats.pending} description="Cần phản hồi hoặc xác nhận" tone={stats.pending ? 'amber' : 'emerald'} />
              <AdminMetricCard icon={CheckCircle} label="Đã xác nhận" value={stats.confirmed} description="Đã đồng ý lịch hẹn" tone="violet" />
              <AdminMetricCard icon={Calendar} label="Lịch hẹn hôm nay" value={stats.today} description="Đúng lịch trong ngày hôm nay" tone="primary" />
              <AdminMetricCard icon={Calendar} label="Tổng số lịch hẹn" value={stats.total} description="Tất cả lịch trong hệ thống" tone="slate" />
            </>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-3 p-4 rounded-xl border bg-card">
          <div className="flex-1">
            <AdminTabs
              value={activeTab}
              onChange={setActiveTab}
              items={TABS.map((tab) => ({ ...tab, count: counts[tab.value] || 0 }))}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên SV, chủ trọ, phòng, SĐT..."
                className="pl-9 rounded-xl h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Date & Sort dropdowns */}
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

        {/* List of Appointments */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-48 rounded-lg" />)}
          </div>
        ) : paginatedAppointments.length === 0 ? (
          <AdminEmptyState
            icon={Calendar}
            title="Không tìm thấy lịch hẹn"
            description="Không tìm thấy lịch hẹn nào khớp với bộ lọc và từ khóa tìm kiếm."
          />
        ) : (
          <div className="space-y-3">
            {paginatedAppointments.map((appt) => {
              const room = appt.room
              const roomImage = room?.images?.[0]
              const canCancel = appt.status === 'pending' || appt.status === 'confirmed'

              return (
                <Card key={appt._id} className="overflow-hidden transition-colors hover:border-primary/40">
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
                              {dayjs(appt.date).format('dddd, DD/MM/YYYY')}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {TIME_SLOT_LABELS[appt.timeSlot] || appt.timeSlot}
                            </span>
                          </div>
                        </div>
                        <div>
                          <StatusBadge status={appt.status} />
                        </div>
                      </div>

                      {formatAddress(room?.address) && (
                        <p className="flex items-start gap-1.5 text-sm leading-6 text-muted-foreground">
                          <MapPin className="mt-1 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{formatAddress(room.address)}</span>
                        </p>
                      )}

                      {/* Participant Details */}
                      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                        {/* Student Info */}
                        <div className="flex items-start gap-3">
                          {appt.student?.avatar ? (
                            <img
                              src={appt.student.avatar}
                              alt={appt.student.name}
                              className="h-9 w-9 rounded-full object-cover border bg-background shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20 mt-0.5">
                              {(appt.student?.name || 'S')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                              Sinh viên (Người thuê)
                            </p>
                            <p className="line-clamp-1 text-sm font-bold mt-0.5">{appt.student?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{appt.student?.phone || 'Chưa cập nhật SĐT'}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{appt.student?.email || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Landlord Info */}
                        <div className="flex items-start gap-3 border-t pt-2 sm:border-t-0 sm:pt-0">
                          {appt.landlord?.avatar ? (
                            <img
                              src={appt.landlord.avatar}
                              alt={appt.landlord.name}
                              className="h-9 w-9 rounded-full object-cover border bg-background shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/10 text-xs font-bold text-violet-600 border border-violet-600/20 mt-0.5">
                              {(appt.landlord?.name || 'L')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
                              Chủ trọ (Cho thuê)
                            </p>
                            <p className="line-clamp-1 text-sm font-bold mt-0.5">{appt.landlord?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{appt.landlord?.phone || 'Chưa cập nhật SĐT'}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{appt.landlord?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {(appt.note || appt.cancelReason) && (
                        <div className={cn(
                          'rounded-lg border px-3 py-2 text-sm leading-6',
                          appt.cancelReason
                            ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                            : 'bg-background text-muted-foreground'
                        )}>
                          {appt.note && <p>Ghi chú người đặt: {appt.note}</p>}
                          {appt.cancelReason && <p>Lý do hủy: {appt.cancelReason}</p>}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        {canCancel && (
                          <Button size="sm" variant="ghost" className="ml-auto h-8 rounded-lg text-xs text-red-600 hover:text-red-700" disabled={actionId === appt._id} onClick={() => { setCancelTarget(appt); setCancelReason('') }}>
                            <XCircle className="h-3.5 w-3.5" />
                            Hủy lịch (Admin)
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={filteredAppointments.length}
          label="lịch hẹn"
          onChange={setPage}
        />
      </AdminContent>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => {
        if (!open) {
          setCancelTarget(null)
          setCancelReason('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin hủy lịch hẹn?</DialogTitle>
            <DialogDescription>
              Hãy nhập lý do hủy lịch hẹn này để thông báo cho cả Chủ trọ và Sinh viên.
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
              Hủy lịch hẹn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
