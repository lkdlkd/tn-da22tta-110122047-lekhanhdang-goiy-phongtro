import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, ExternalLink, Flag, Trash2, User, X } from 'lucide-react'
import dayjs from 'dayjs'
import { adminGetReportsApi, adminResolveReportApi } from '@/services/reportService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  AdminContent,
  AdminEmptyState,
  AdminFilterPills,
  AdminPageHeader,
  AdminPagination,
  AdminTabs,
} from '@/pages/admin/components/AdminUI'

const REASON_LABELS = {
  fake_info: 'Thông tin sai lệch',
  wrong_price: 'Giá không đúng',
  fake_images: 'Ảnh giả mạo',
  spam: 'Spam / quảng cáo',
  other: 'Lý do khác',
}

const REASON_BADGE_CLS = {
  fake_info: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  wrong_price: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  fake_images: 'border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  spam: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  other: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
}

const STATUS_CFG = {
  pending: { label: 'Chờ xử lý', cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  reviewed: { label: 'Đang xem xét', cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  resolved: { label: 'Đã giải quyết', cls: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300' },
}

const STATUS_TABS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'reviewed', label: 'Đang xem xét' },
  { value: 'resolved', label: 'Đã giải quyết' },
  { value: '', label: 'Tất cả' },
]

const REASON_FILTERS = [
  { value: '', label: 'Tất cả lý do' },
  ...Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label })),
]

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reasonFilter, setReasonFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [resolveTarget, setResolveTarget] = useState(null)
  const [actionId, setActionId] = useState('')
  const LIMIT = 10

  const fetchReports = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: LIMIT }
      if (statusFilter) params.status = statusFilter
      if (reasonFilter) params.reason = reasonFilter
      const res = await adminGetReportsApi(params)
      setReports(res.data?.data?.reports || [])
      setPagination(res.data?.data?.pagination || { total: 0, totalPages: 1 })
    } catch {
      toast.error('Không thể tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, reasonFilter, page])

  useEffect(() => { setPage(1); fetchReports(1) }, [statusFilter, reasonFilter])
  useEffect(() => { fetchReports(page) }, [page])

  const handleResolve = async (action) => {
    if (!resolveTarget) return
    setActionId(resolveTarget._id)
    try {
      await adminResolveReportApi(resolveTarget._id, action)
      setReports((prev) => prev.map((report) => report._id === resolveTarget._id ? { ...report, status: 'resolved' } : report))
      toast.success(action === 'remove_room' ? 'Đã gỡ phòng vi phạm' : 'Đã xử lý báo cáo')
    } catch {
      toast.error('Lỗi xử lý báo cáo')
    } finally {
      setActionId('')
      setResolveTarget(null)
    }
  }

  const pendingCount = reports.filter((report) => report.status === 'pending').length

  return (
    <>
      <AdminPageHeader
        title="Báo cáo vi phạm"
        description="Xem xét các báo cáo từ người dùng và xử lý phòng có dấu hiệu vi phạm."
        icon={Flag}
        meta={(
          <>
            <Badge variant="secondary">{pagination.total} báo cáo</Badge>
            {pendingCount > 0 && <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">{pendingCount} chờ xử lý</Badge>}
          </>
        )}
        onRefresh={() => fetchReports(page)}
        refreshing={loading}
      />

      <AdminContent>
        <div className="space-y-3">
          <AdminTabs
            value={statusFilter}
            onChange={setStatusFilter}
            items={STATUS_TABS.map((tab) => ({ ...tab, count: tab.value === 'pending' ? pendingCount : 0 }))}
          />
          <AdminFilterPills value={reasonFilter} onChange={setReasonFilter} items={REASON_FILTERS} />
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-80 max-w-full" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : reports.length === 0 ? (
            <AdminEmptyState icon={Flag} title="Không có báo cáo" description="Không có báo cáo phù hợp với bộ lọc hiện tại." />
          ) : (
            reports.map((report) => {
              const status = STATUS_CFG[report.status] || STATUS_CFG.pending
              const reasonCls = REASON_BADGE_CLS[report.reason] || REASON_BADGE_CLS.other
              return (
                <Card key={report._id} className={cn(report.status === 'pending' && 'border-l-4 border-l-red-400', report.status === 'resolved' && 'opacity-75')}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {report.room?.slug ? (
                            <Link to={`/rooms/${report.room.slug}`} target="_blank" className="inline-flex items-center gap-1 font-semibold hover:text-primary">
                              {report.room?.title || 'Phòng đã xóa'}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <span className="font-semibold">Phòng đã xóa</span>
                          )}
                          <Badge variant="outline" className={status.cls}>{status.label}</Badge>
                          {report.room?.status === 'flagged' && (
                            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                              <AlertTriangle className="h-3 w-3" />
                              Vi phạm
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <strong className="text-foreground">{report.reportedBy?.name || 'Người dùng'}</strong>
                            {report.reportedBy?.email && <span>({report.reportedBy.email})</span>}
                          </span>
                          <span>{dayjs(report.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-2 rounded-lg bg-muted/40 p-3">
                      <Badge variant="outline" className={reasonCls}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </Badge>
                      <p className="min-w-48 flex-1 text-sm leading-6 text-muted-foreground">
                        {report.description || 'Người dùng không nhập mô tả chi tiết.'}
                      </p>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">Chọn xử lý để bỏ qua, ẩn phòng hoặc xóa phòng vi phạm.</p>
                        <Button size="sm" variant="outline" className="h-9 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setResolveTarget(report)}>
                          <Flag className="h-4 w-4" />
                          Xử lý báo cáo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <AdminPagination page={page} totalPages={pagination.totalPages} total={pagination.total} label="báo cáo" onChange={setPage} />
      </AdminContent>

      <Dialog open={Boolean(resolveTarget)} onOpenChange={() => setResolveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Xử lý báo cáo
            </DialogTitle>
            <DialogDescription>
              Phòng: <strong>{resolveTarget?.room?.title || 'Không xác định'}</strong><br />
              Lý do: <strong>{REASON_LABELS[resolveTarget?.reason] || resolveTarget?.reason}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={Boolean(actionId)}
              onClick={() => handleResolve('dismiss')}
              className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors hover:bg-muted disabled:opacity-50"
            >
              <X className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-semibold">Bỏ qua</span>
            </button>
            <button
              disabled={Boolean(actionId)}
              onClick={() => handleResolve('hide_room')}
              className="flex flex-col items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-center text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
            >
              <Flag className="h-5 w-5" />
              <span className="text-xs font-semibold">Ẩn phòng</span>
            </button>
            <button
              disabled={Boolean(actionId)}
              onClick={() => handleResolve('remove_room')}
              className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-xs font-semibold">Xóa phòng</span>
            </button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolveTarget(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
