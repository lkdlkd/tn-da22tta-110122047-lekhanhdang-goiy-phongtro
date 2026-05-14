import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart2,
  CheckCircle,
  Eye,
  Flag,
  Home,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react'
import { adminGetStatsApi } from '@/services/adminService'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminContent, AdminMetricCard, AdminPageHeader } from '@/pages/admin/components/AdminUI'

const STAT_CONFIGS = [
  {
    key: 'totalRooms',
    label: 'Tổng phòng',
    icon: Home,
    tone: 'primary',
    href: '/admin/rooms',
    description: 'Tất cả phòng trong hệ thống',
  },
  {
    key: 'pendingRooms',
    label: 'Chờ duyệt',
    icon: CheckCircle,
    tone: 'amber',
    href: '/admin/rooms',
    description: 'Phòng đang cần kiểm duyệt',
  },
  {
    key: 'totalUsers',
    label: 'Người dùng',
    icon: Users,
    tone: 'violet',
    href: '/admin/users',
    description: 'Tài khoản đã đăng ký',
  },
  {
    key: 'pendingComments',
    label: 'Bình luận chờ',
    icon: MessageSquare,
    tone: 'emerald',
    href: '/admin/comments',
    description: 'Bình luận cần xử lý',
  },
]

function MonthlyBar({ month, year, count, max }) {
  const pct = max > 0 ? Math.max((count / max) * 100, 6) : 6
  return (
    <div className="flex min-w-10 flex-col items-center gap-1">
      <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{count}</span>
      <div className="flex h-20 w-8 items-end overflow-hidden rounded-lg bg-muted">
        <div className="w-full rounded-lg bg-primary/75 transition-all" style={{ height: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground">T{month}/{String(year).slice(2)}</span>
    </div>
  )
}

function QuickLink({ to, icon: Icon, label, desc, badge }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
          {badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    setLoading(true)
    adminGetStatsApi()
      .then((res) => setStats(res.data?.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  const monthlyMax = stats?.monthlyData?.length
    ? Math.max(...stats.monthlyData.map((item) => item.count))
    : 0

  return (
    <>
      <AdminPageHeader
        title="Tổng quan"
        description="Theo dõi nhanh tình trạng phòng, người dùng và nội dung cần kiểm duyệt."
        icon={Activity}
        onRefresh={fetchStats}
        refreshing={loading}
      />

      <AdminContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CONFIGS.map((config) => (
            loading ? (
              <Card key={config.key}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-9 w-16" />
                  <Skeleton className="mt-3 h-3 w-36" />
                </CardContent>
              </Card>
            ) : (
              <AdminMetricCard
                key={config.key}
                {...config}
                value={stats?.[config.key]?.toLocaleString?.() ?? stats?.[config.key] ?? 0}
                urgent={config.key === 'pendingRooms' && stats?.pendingRooms > 0}
              />
            )
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between border-b px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Phòng xem nhiều nhất
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="rounded-lg text-primary hover:text-primary">
                <Link to="/admin/rooms">
                  Tất cả
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 border-b px-5 py-3 last:border-b-0">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-12 w-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))
              ) : !stats?.topRooms?.length ? (
                <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
                  <Home className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Chưa có dữ liệu phòng nổi bật.</p>
                </div>
              ) : (
                stats.topRooms.map((room, index) => (
                  <div key={room._id} className="flex items-center gap-4 border-b px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/30">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    {room.images?.[0] ? (
                      <img src={room.images[0]} alt="" className="h-12 w-20 shrink-0 rounded-lg border object-cover" />
                    ) : (
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border bg-muted">
                        <Home className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link to={`/rooms/${room.slug}`} target="_blank" className="line-clamp-1 text-sm font-semibold hover:text-primary">
                        {room.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {room.address?.district && <span>{room.address.district}</span>}
                        {room.price && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span>{new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(room.price)}đ/tháng</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="font-semibold tabular-nums">{room.viewCount?.toLocaleString?.() || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-base">Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                <QuickLink to="/admin/rooms" icon={CheckCircle} label="Duyệt phòng" desc="Xem danh sách phòng chờ duyệt" badge={stats?.pendingRooms} />
                <QuickLink to="/admin/comments" icon={MessageSquare} label="Duyệt bình luận" desc="Kiểm duyệt phản hồi người dùng" badge={stats?.pendingComments} />
                <QuickLink to="/admin/reports" icon={Flag} label="Báo cáo vi phạm" desc="Xử lý tố cáo từ người dùng" />
                <QuickLink to="/admin/users" icon={Users} label="Người dùng" desc="Quản lý tài khoản hệ thống" />
              </CardContent>
            </Card>

            {(loading || stats?.monthlyData?.length > 0) && (
              <Card>
                <CardHeader className="border-b px-5 py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    Phòng đăng theo tháng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {loading ? (
                    <div className="flex h-24 items-end gap-2">
                      {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="flex-1 rounded-lg" style={{ height: `${35 + index * 6}%` }} />)}
                    </div>
                  ) : (
                    <div className="flex items-end justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {stats.monthlyData.slice(-8).map((item) => (
                        <MonthlyBar key={`${item._id.month}-${item._id.year}`} month={item._id.month} year={item._id.year} count={item.count} max={monthlyMax} />
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-center text-xs text-muted-foreground">Dữ liệu các tháng gần đây</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AdminContent>
    </>
  )
}
