import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CircleSlash,
  DoorOpen,
  Eye,
  Home,
  LayoutGrid,
  LayoutList,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { deleteRoomApi, getMyRoomsApi } from '@/services/roomService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LandlordContent,
  LandlordEmptyState,
  LandlordMetricCard,
  LandlordPageHeader,
  LandlordTabs,
  StatusBadge,
} from './components/LandlordUI'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'flagged', label: 'Vi phạm' },
]

function formatCurrency(value) {
  if (!value) return 'Đang cập nhật'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatAddress(address) {
  if (!address) return ''
  if (typeof address === 'string') return address
  return address.fullAddress || [address.street, address.ward, address.district, address.city].filter(Boolean).join(', ')
}

function RoomImage({ room, className }) {
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {room.images?.[0] ? (
        <img src={room.images[0]} alt={room.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <Home className="h-8 w-8" />
          <span className="text-xs">Chưa có ảnh</span>
        </div>
      )}
    </div>
  )
}

function RoomActions({ room, onDelete, deletingId }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 flex-1 rounded-lg text-xs" asChild>
        <Link to={`/rooms/${room.slug}`}>
          <Eye className="h-3.5 w-3.5" />
          Xem
        </Link>
      </Button>
      <Button variant="secondary" size="sm" className="h-8 flex-1 rounded-lg text-xs" asChild>
        <Link to={`/landlord/rooms/${room._id}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
          Sửa
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
        onClick={() => onDelete(room)}
        disabled={deletingId === room._id}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function RoomGridCard({ room, onDelete, deletingId }) {
  const address = formatAddress(room.address)
  const unavailable = !room.isAvailable

  return (
    <Card className={cn('group overflow-hidden transition-colors hover:border-primary/40', room.status === 'rejected' && 'border-red-200')}>
      <RoomImage room={room} className="aspect-[4/3]" />
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={room.status || 'pending'} type="approval" compact />
          <StatusBadge status={room.isAvailable ? 'available' : 'rented'} type="availability" compact />
        </div>

        <div className="min-w-0 space-y-1">
          <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{room.title}</h2>
          {address && (
            <p className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{address}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Giá</p>
            <p className="mt-1 truncate text-xs font-bold text-primary">{formatCurrency(room.price)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Diện tích</p>
            <p className="mt-1 text-xs font-semibold">{room.area || 0} m²</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Sức chứa</p>
            <p className="mt-1 text-xs font-semibold">{room.capacity || 1} người</p>
          </div>
        </div>

        {(room.status === 'flagged' || room.status === 'rejected' || unavailable) && (
          <div className={cn(
            'flex gap-2 rounded-lg border px-3 py-2 text-xs leading-5',
            room.status === 'flagged' || room.status === 'rejected'
              ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
              : 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
          )}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {room.status === 'flagged' && 'Tin đang bị ẩn do vi phạm. Vui lòng kiểm tra và chỉnh sửa.'}
              {room.status === 'rejected' && 'Tin đã bị từ chối. Hãy cập nhật nội dung trước khi đăng lại.'}
              {room.status !== 'flagged' && room.status !== 'rejected' && unavailable && 'Phòng đã cho thuê, sinh viên sẽ thấy trạng thái này khi xem tin.'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {(room.viewCount || 0).toLocaleString('vi-VN')} lượt xem
          </span>
        </div>

        <RoomActions room={room} onDelete={onDelete} deletingId={deletingId} />
      </CardContent>
    </Card>
  )
}

function RoomListItem({ room, onDelete, deletingId }) {
  const address = formatAddress(room.address)

  return (
    <Card className="group overflow-hidden transition-colors hover:border-primary/40">
      <CardContent className="grid gap-0 p-0 sm:grid-cols-[220px_1fr]">
        <RoomImage room={room} className="aspect-[16/9] sm:aspect-auto" />
        <div className="min-w-0 space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={room.status || 'pending'} type="approval" compact />
                <StatusBadge status={room.isAvailable ? 'available' : 'rented'} type="availability" compact />
              </div>
              <h2 className="line-clamp-1 pt-1 font-semibold">{room.title}</h2>
              {address && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{address}</span>
                </p>
              )}
            </div>
            <div className="text-left md:text-right">
              <p className="font-bold text-primary">{formatCurrency(room.price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{room.area || 0} m² · {room.capacity || 1} người</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{(room.viewCount || 0).toLocaleString('vi-VN')} lượt xem</span>
            <div className="sm:w-[260px]">
              <RoomActions room={room} onDelete={onDelete} deletingId={deletingId} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LandlordRoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  const fetchMyRooms = async () => {
    try {
      setLoading(true)
      const res = await getMyRoomsApi()
      setRooms(res.data?.data?.rooms || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyRooms()
  }, [])

  const stats = useMemo(() => ({
    total: rooms.length,
    available: rooms.filter((room) => room.isAvailable && room.status === 'approved').length,
    rented: rooms.filter((room) => !room.isAvailable).length,
    pending: rooms.filter((room) => room.status === 'pending').length,
    issues: rooms.filter((room) => room.status === 'flagged' || room.status === 'rejected').length,
  }), [rooms])

  const counts = useMemo(() => {
    const result = { all: rooms.length }
    rooms.forEach((room) => {
      result[room.status] = (result[room.status] || 0) + 1
    })
    return result
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return rooms.filter((room) => {
      const byStatus = activeTab === 'all' || room.status === activeTab
      const bySearch = !keyword || [room.title, formatAddress(room.address)]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
      return byStatus && bySearch
    })
  }, [rooms, activeTab, search])

  const handleDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      setDeletingId(deleteTarget._id)
      await deleteRoomApi(deleteTarget._id)
      setRooms((prev) => prev.filter((room) => room._id !== deleteTarget._id))
      toast.success('Đã xoá phòng')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xoá phòng thất bại')
    } finally {
      setDeletingId('')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <LandlordPageHeader
        title="Quản lý phòng trọ"
        description="Theo dõi tình trạng duyệt tin, trạng thái cho thuê và hiệu quả từng phòng."
        icon={Home}
        onRefresh={fetchMyRooms}
        refreshing={loading}
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
              <LandlordMetricCard icon={Home} label="Tổng tin đăng" value={stats.total} description="Tất cả phòng của bạn" tone="blue" />
              <LandlordMetricCard icon={DoorOpen} label="Còn trống" value={stats.available} description="Đã duyệt và sẵn sàng cho thuê" tone="emerald" />
              <LandlordMetricCard icon={CircleSlash} label="Đã cho thuê" value={stats.rented} description="Phòng đang tạm dừng nhận khách" tone="slate" />
              <LandlordMetricCard icon={AlertTriangle} label="Cần xử lý" value={stats.pending + stats.issues} description={`${stats.pending} chờ duyệt, ${stats.issues} có vấn đề`} tone={stats.issues ? 'red' : 'amber'} urgent={stats.issues > 0} />
            </>
          )}
        </div>

        {!loading && rooms.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <LandlordTabs
                value={activeTab}
                onChange={setActiveTab}
                items={FILTERS.map((item) => ({ ...item, count: counts[item.value] || 0 }))}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm theo tên hoặc địa chỉ"
                    className="h-10 rounded-lg pl-9"
                  />
                </div>
                <div className="grid grid-cols-2 rounded-lg border bg-card p-1">
                  <Button type="button" size="icon" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} className="h-8 w-8 rounded-md" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant={viewMode === 'list' ? 'secondary' : 'ghost'} className="h-8 w-8 rounded-md" onClick={() => setViewMode('list')}>
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Card key={item} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <LandlordEmptyState
            icon={rooms.length ? Search : Home}
            title={rooms.length ? 'Không tìm thấy phòng phù hợp' : 'Bạn chưa có phòng nào'}
            description={rooms.length ? 'Thử đổi bộ lọc hoặc nhập từ khoá ngắn hơn.' : 'Đăng phòng đầu tiên để sinh viên có thể tìm thấy và đặt lịch xem phòng.'}
            action={!rooms.length && (
              <Button asChild className="mt-1 rounded-lg">
                <Link to="/landlord/rooms/create">
                  <Plus className="h-4 w-4" />
                  Đăng phòng đầu tiên
                </Link>
              </Button>
            )}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomGridCard key={room._id} room={room} onDelete={setDeleteTarget} deletingId={deletingId} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <RoomListItem key={room._id} room={room} onDelete={setDeleteTarget} deletingId={deletingId} />
            ))}
          </div>
        )}
      </LandlordContent>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá phòng này?</DialogTitle>
            <DialogDescription>
              Tin đăng "{deleteTarget?.title}" sẽ bị xoá vĩnh viễn và không thể khôi phục.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Huỷ</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={Boolean(deletingId)}>
              <Trash2 className="h-4 w-4" />
              {deletingId ? 'Đang xoá...' : 'Xoá phòng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
