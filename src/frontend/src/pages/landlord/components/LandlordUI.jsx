import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function LandlordPageHeader({
  title,
  description,
  icon: Icon,
  meta,
  action,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            {Icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-card text-primary">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
              {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                Làm mới
              </Button>
            )}
            {action}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandlordContent({ children, className }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

export function LandlordMetricCard({ icon: Icon, label, value, description, href, tone = 'primary', urgent }) {
  const tones = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/30',
    red: 'bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/30',
    slate: 'bg-slate-50 text-slate-700 border border-slate-200/60 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800/40',
  }

  const body = (
    <Card className={cn(
      'h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30', 
      urgent && 'border-amber-300 bg-amber-50/10'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{value ?? 0}</p>
            {description && <p className="mt-1.5 text-xs leading-5 text-muted-foreground/90">{description}</p>}
          </div>
          {Icon && (
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105', tones[tone] || tones.primary)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {urgent && (
          <Badge variant="outline" className="mt-4 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse">
            Cần kiểm tra
          </Badge>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link to={href} className="group block">{body}</Link> : body
}

export function LandlordTabs({ value, onChange, items }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm scrollbar-none">
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = value === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all duration-300',
                active 
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10' 
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              {item.label}
              {item.count > 0 && (
                <span className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black',
                  active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LandlordEmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <p className="font-semibold">{title}</p>
          {description && <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {action}
      </CardContent>
    </Card>
  )
}

export function StatusBadge({ status, type = 'approval', compact = false }) {
  const approval = {
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    rejected: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    flagged: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  }
  const approvalLabels = {
    approved: 'Đã duyệt',
    pending: 'Chờ duyệt',
    rejected: 'Từ chối',
    flagged: 'Vi phạm',
  }
  const appointment = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    confirmed: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    cancelled: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  }
  const appointmentLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }
  const availability = {
    available: 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    rented: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  }
  const availabilityLabels = {
    available: 'Còn trống',
    rented: 'Đã cho thuê',
  }

  const maps = {
    approval: [approval, approvalLabels],
    appointment: [appointment, appointmentLabels],
    availability: [availability, availabilityLabels],
  }
  const [classes, labels] = maps[type] || maps.approval

  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 border font-semibold',
        compact ? 'px-2 py-0 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        classes[status] || classes.pending
      )}
    >
      {labels[status] || status || 'Không rõ'}
    </Badge>
  )
}
