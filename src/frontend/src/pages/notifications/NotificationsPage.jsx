import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Home,
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { toast } from 'sonner'
import { getNotificationsApi, markAllReadApi, markOneReadApi } from '@/services/notificationService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const TYPE_META = {
  room_approved: { label: 'Phòng', icon: Home, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
  room_rejected: { label: 'Kiểm duyệt', icon: ShieldAlert, cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300' },
  new_message: { label: 'Tin nhắn', icon: MessageCircle, cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
  new_room: { label: 'Phòng mới', icon: Home, cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300' },
  comment_approved: { label: 'Bình luận', icon: Check, cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  comment_replied: { label: 'Phản hồi', icon: MessageCircle, cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300' },
  system: { label: 'Hệ thống', icon: Sparkles, cls: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300' },
}

function NotificationSkeleton() {
  return (
    <Card>
      <CardContent className="flex gap-3 p-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationItem({ notification, onMarkOne }) {
  const meta = TYPE_META[notification.type] || TYPE_META.system
  const Icon = meta.icon

  return (
    <Card className={cn('transition-colors hover:border-primary/40', !notification.isRead && 'border-primary/30 bg-primary/5')}>
      <CardContent className="flex gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', meta.cls)}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn('line-clamp-2 text-sm font-semibold', notification.isRead && 'font-medium text-muted-foreground')}>
                  {notification.title}
                </p>
                {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{dayjs(notification.createdAt).fromNow()}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border text-xs', meta.cls)}>{meta.label}</Badge>
            {notification.link && (
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" asChild>
                <Link to={notification.link}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Xem chi tiết
                </Link>
              </Button>
            )}
            {!notification.isRead && (
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => onMarkOne(notification._id)}>
                <Check className="h-3.5 w-3.5" />
                Đã đọc
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  const load = async () => {
    try {
      setLoading(true)
      const res = await getNotificationsApi({ limit: 50 })
      setNotifications(res.data?.data?.notifications || [])
      setUnreadCount(res.data?.data?.unreadCount || 0)
    } catch {
      toast.error('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') return notifications.filter((item) => !item.isRead)
    if (activeFilter === 'read') return notifications.filter((item) => item.isRead)
    return notifications
  }, [notifications, activeFilter])

  const handleMarkOne = async (id) => {
    try {
      await markOneReadApi(id)
      setNotifications((prev) => prev.map((item) => item._id === id ? { ...item, isRead: true } : item))
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch {
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllReadApi()
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
      toast.success('Đã đánh dấu tất cả đã đọc')
    } catch {
      toast.error('Không thể cập nhật thông báo')
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <section className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-card text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Theo dõi tin nhắn, lịch hẹn, kiểm duyệt phòng và các cập nhật hệ thống.
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" className="h-9 rounded-lg" onClick={handleMarkAll}>
                <CheckCheck className="h-4 w-4" />
                Đọc tất cả
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả', count: notifications.length },
              { value: 'unread', label: 'Chưa đọc', count: unreadCount },
              { value: 'read', label: 'Đã đọc', count: Math.max(0, notifications.length - unreadCount) },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveFilter(item.value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  activeFilter === item.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {item.label}
                {item.count > 0 && <span className="ml-1.5 text-xs opacity-80">{item.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl space-y-3 px-4 py-5 sm:px-6 lg:px-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <NotificationSkeleton key={index} />)
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{notifications.length ? 'Không có thông báo trong mục này' : 'Chưa có thông báo nào'}</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                  Khi có tin nhắn, lịch hẹn hoặc cập nhật mới, bạn sẽ thấy chúng ở đây.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} onMarkOne={handleMarkOne} />
          ))
        )}
      </main>
    </div>
  )
}
