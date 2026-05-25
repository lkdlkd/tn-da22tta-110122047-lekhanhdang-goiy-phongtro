import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  meta,
  action,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="flex flex-col gap-4 border-b bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary">
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
  )
}

export function AdminContent({ children, className }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

export function AdminTabs({ value, onChange, items }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-1 scrollbar-none">
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = value === item.value
          return (
            <button
              key={item.value}
              onClick={() => onChange(item.value)}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
              {item.count > 0 && (
                <span className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
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

export function AdminFilterPills({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value === item.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function AdminPagination({ page, totalPages = 1, total = 0, label = 'mục', onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {total} {label} · Trang {page}/{totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
          const p = totalPages <= 5 ? index + 1 : page <= 3 ? index + 1 : page + index - 2
          if (p < 1 || p > totalPages) return null
          return (
            <Button
              key={p}
              size="icon"
              className="h-8 w-8 rounded-lg text-xs"
              variant={p === page ? 'default' : 'outline'}
              onClick={() => onChange(p)}
            >
              {p}
            </Button>
          )
        })}
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function AdminEmptyState({ icon: Icon, title, description }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <p className="font-semibold">{title}</p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminMetricCard({ icon: Icon, label, value, description, href, tone = 'primary', urgent }) {
  const tones = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/30',
    red: 'bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/30',
  }

  const body = (
    <Card className={cn(
      'h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30',
      urgent && 'border-amber-300/80 bg-amber-50/10 dark:bg-amber-950/5'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{value ?? '0'}</p>
            {description && <p className="mt-1.5 text-xs leading-5 text-muted-foreground/90">{description}</p>}
          </div>
          {Icon && (
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105', tones[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {urgent && (
          <Badge variant="outline" className="mt-4 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse">
            Cần xử lý gấp
          </Badge>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link to={href} className="group block">{body}</Link> : body
}
