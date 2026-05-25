import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Home,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  TrendingUp,
} from 'lucide-react'
import { getLandlordPublicProfileApi } from '@/services/userService'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function formatAddress(address) {
  if (!address) return 'Vĩnh Long'
  if (typeof address === 'string') return address
  return address.fullAddress || [address.ward, address.district, address.city].filter(Boolean).join(', ')
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <Skeleton className="h-80 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-lg" />)}
        </div>
      </div>
    </div>
  )
}

export default function LandlordProfilePage() {
  const { username } = useParams()
  const user = useSelector((state) => state.auth?.user)
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getLandlordPublicProfileApi(username)
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [username])

  const filteredRooms = useMemo(() => {
    const list = data?.rooms || []
    if (filter === 'available') return list.filter((room) => room.isAvailable)
    if (filter === 'rented') return list.filter((room) => !room.isAvailable)
    return list
  }, [data?.rooms, filter])

  if (loading) return <PageSkeleton />

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Home className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Không tìm thấy chủ trọ</h2>
          <p className="mt-1 text-sm text-muted-foreground">Trang hồ sơ này không tồn tại hoặc đã bị xóa.</p>
        </div>
        <Button variant="outline" asChild><Link to="/search">Tìm phòng trọ</Link></Button>
      </div>
    )
  }

  const { landlord, rooms = [], stats = {} } = data
  const joinedDate = landlord.createdAt
    ? new Date(landlord.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : 'Đang cập nhật'
  const goMessage = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(`/messages?to=${landlord._id}`)
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <section className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              {landlord.avatar ? (
                <img src={landlord.avatar} alt={landlord.name} className="h-24 w-24 shrink-0 rounded-lg border object-cover" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-3xl font-bold text-primary">
                  {(landlord.name || 'C')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight">{landlord.name}</h1>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                    Chủ trọ
                  </Badge>
                </div>
                {landlord.username && <p className="mt-1 font-mono text-sm text-muted-foreground">@{landlord.username}</p>}
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {stats.totalRooms || rooms.length} phòng trọ · {stats.availableRooms || rooms.filter((room) => room.isAvailable).length} phòng còn trống
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="h-9 rounded-lg" onClick={goMessage}>
                <MessageCircle className="h-4 w-4" />
                Nhắn tin
              </Button>
              {landlord.phone && (
                <Button variant="outline" className="h-9 rounded-lg" asChild>
                  <a href={`tel:${landlord.phone}`}><Phone className="h-4 w-4" />{landlord.phone}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="font-semibold">Giới thiệu</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Tham gia từ <strong className="text-foreground">{joinedDate}</strong></p>
                {landlord.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /><a href={`tel:${landlord.phone}`} className="font-medium text-foreground hover:text-primary">{landlord.phone}</a></p>}
              </div>
              <SeparatorLine />
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Tổng phòng" value={stats.totalRooms || rooms.length} tone="text-blue-600" />
                <Stat label="Còn trống" value={stats.availableRooms || rooms.filter((room) => room.isAvailable).length} tone="text-emerald-600" />
                <Stat label="Điểm TB" value={Number(stats.avgRating) > 0 ? Number(stats.avgRating).toFixed(1) : '-'} tone="text-amber-600" />
              </div>
              {(landlord.responseRate != null || landlord.avgResponseTime != null) && (
                <>
                  <SeparatorLine />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phản hồi</p>
                    {landlord.responseRate != null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" />Tỷ lệ trả lời</span>
                          <span className="font-bold text-emerald-600">{landlord.responseRate}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${landlord.responseRate}%` }} />
                        </div>
                      </div>
                    )}
                    {landlord.avgResponseTime != null && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Thời gian TB: <strong className="text-foreground">{landlord.avgResponseTime < 60 ? `${landlord.avgResponseTime} phút` : landlord.avgResponseTime < 1440 ? `${Math.round(landlord.avgResponseTime / 60)} giờ` : `${Math.round(landlord.avgResponseTime / 1440)} ngày`}</strong>
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hidden lg:block">
            <CardContent className="space-y-2 p-4">
              <h2 className="font-semibold text-sm text-foreground/90">Lọc nhanh</h2>
              {[
                { value: 'all', label: 'Tất cả phòng', count: rooms.length },
                { value: 'available', label: 'Còn trống', count: rooms.filter((room) => room.isAvailable).length },
                { value: 'rented', label: 'Đã cho thuê', count: rooms.filter((room) => !room.isAvailable).length },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-300 font-medium',
                    filter === item.value ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{item.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.count}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-4">
          {/* Mobile Filter Tabs Segment (hidden on desktop) */}
          <div className="overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm scrollbar-none lg:hidden">
            <div className="flex min-w-max gap-1">
              {[
                { value: 'all', label: 'Tất cả phòng', count: rooms.length },
                { value: 'available', label: 'Còn trống', count: rooms.filter((room) => room.isAvailable).length },
                { value: 'rented', label: 'Đã cho thuê', count: rooms.filter((room) => !room.isAvailable).length },
              ].map((item) => {
                const active = filter === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all duration-300',
                      active 
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10' 
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {item.label}
                    <span className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black',
                      active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {item.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  {filter === 'available' ? 'Phòng còn trống' : filter === 'rented' ? 'Phòng đã cho thuê' : 'Tất cả phòng'}
                </h2>
                <p className="text-sm text-muted-foreground">{filteredRooms.length} phòng phù hợp</p>
              </div>
              <div className="grid w-fit grid-cols-2 rounded-lg border bg-card p-1">
                <Button type="button" size="icon" variant={view === 'grid' ? 'secondary' : 'ghost'} className="h-8 w-8 rounded-md" onClick={() => setView('grid')}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant={view === 'list' ? 'secondary' : 'ghost'} className="h-8 w-8 rounded-md" onClick={() => setView('list')}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {filteredRooms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Không có phòng phù hợp</p>
                  <p className="mt-1 text-sm text-muted-foreground">Thử đổi bộ lọc hoặc quay lại sau.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={cn('grid gap-4', view === 'list' ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-3')}>
              {filteredRooms.map((room) => <RoomCard key={room._id} room={room} view={view} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function SeparatorLine() {
  return <div className="h-px bg-border" />
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className={cn('text-xl font-extrabold', tone)}>{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  )
}
