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
import { cn } from '@/lib/utils'
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
    <div className="flex min-w-10 flex-col items-center gap-1 group/bar">
      <span className="text-[10px] font-bold text-muted-foreground/80 tabular-nums opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200">{count}</span>
      <div className="flex h-20 w-8 items-end overflow-hidden rounded-lg bg-muted/60 border border-transparent hover:border-primary/20 transition-all duration-300">
        <div 
          className="w-full rounded-lg bg-gradient-to-t from-primary/85 to-primary transition-all duration-500 hover:brightness-110" 
          style={{ height: `${pct}%` }} 
          title={`Tháng ${month}/${year}: ${count} phòng`}
        />
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground">T{month}/{String(year).slice(2)}</span>
    </div>
  )
}

function QuickLink({ to, icon: Icon, label, desc, badge }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border bg-background p-3 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">{label}</p>
          {badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-black text-primary-foreground shadow-sm shadow-primary/20 animate-pulse">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs leading-5 text-muted-foreground/80 truncate">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5" />
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
          {STAT_CONFIGS.map((config) => {
            const { key, ...rest } = config
            return loading ? (
              <Card key={key}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-9 w-16" />
                  <Skeleton className="mt-3 h-3 w-36" />
                </CardContent>
              </Card>
            ) : (
              <AdminMetricCard
                key={key}
                {...rest}
                value={stats?.[key]?.toLocaleString?.() ?? stats?.[key] ?? 0}
                urgent={key === 'pendingRooms' && stats?.pendingRooms > 0}
              />
            )
          })}
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
                stats.topRooms.map((room, index) => {
                  const rankCls = [
                    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30',
                    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50',
                    'bg-orange-100 text-orange-850 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/20'
                  ][index] || 'bg-muted text-muted-foreground'

                  return (
                    <div key={room._id} className="group/item flex items-center gap-4 border-b px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/40">
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border", rankCls)}>
                        {index + 1}
                      </span>
                      {room.images?.[0] ? (
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          <img src={room.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border bg-muted">
                          <Home className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link to={`/rooms/${room.slug}`} target="_blank" className="line-clamp-1 text-sm font-bold text-foreground hover:text-primary transition-colors">
                          {room.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {room.address?.district && <span className="font-medium">{room.address.district}</span>}
                          {room.price && (
                            <>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="font-semibold text-primary">{new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(room.price)}đ/tháng</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground/80 group-hover/item:text-primary transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="font-bold tabular-nums">{room.viewCount?.toLocaleString?.() || 0}</span>
                      </div>
                    </div>
                  )
                })
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
