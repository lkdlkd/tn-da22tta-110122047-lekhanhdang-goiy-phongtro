import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle, ExternalLink, MessageSquare, Trash2, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import {
  adminApproveCommentApi,
  adminDeleteCommentApi,
  adminGetCommentsApi,
  adminRejectCommentApi,
} from '@/services/commentService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AdminContent, AdminEmptyState, AdminPageHeader, AdminPagination, AdminTabs } from '@/pages/admin/components/AdminUI'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const STATUS_CFG = {
  pending: { label: 'Chờ duyệt', cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  approved: { label: 'Đã duyệt', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  rejected: { label: 'Từ chối', cls: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
}

const STATUS_TABS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: '', label: 'Tất cả' },
]

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [actionId, setActionId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (status) params.status = status
      const res = await adminGetCommentsApi(params)
      setComments(res.data?.data?.comments || [])
      setPagination(res.data?.data?.pagination || { total: 0, totalPages: 1 })
    } catch {
      toast.error('Không thể tải danh sách bình luận')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleStatusChange = (value) => {
    setStatus(value)
    setPage(1)
  }

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await adminApproveCommentApi(id)
      toast.success('Đã duyệt bình luận')
      fetchComments()
    } catch {
      toast.error('Thao tác thất bại')
    } finally {
      setActionId('')
    }
  }

  const handleReject = async (id) => {
    setActionId(id)
    try {
      await adminRejectCommentApi(id)
      toast.success('Đã từ chối bình luận')
      fetchComments()
    } catch {
      toast.error('Thao tác thất bại')
    } finally {
      setActionId('')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionId(deleteTarget._id)
    try {
      await adminDeleteCommentApi(deleteTarget._id)
      toast.success('Đã xóa bình luận')
      setDeleteTarget(null)
      fetchComments()
    } catch {
      toast.error('Xóa thất bại')
    } finally {
      setActionId('')
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Bình luận"
        description="Duyệt, từ chối hoặc xóa các bình luận xuất hiện trên trang chi tiết phòng."
        icon={MessageSquare}
        meta={<Badge variant="secondary">{pagination.total || 0} bình luận</Badge>}
        onRefresh={fetchComments}
        refreshing={loading}
      />

      <AdminContent>
        <AdminTabs value={status} onChange={handleStatusChange} items={STATUS_TABS} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="flex gap-3 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <AdminEmptyState icon={MessageSquare} title="Không có bình luận" description="Không có nội dung phù hợp với bộ lọc hiện tại." />
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const statusConfig = STATUS_CFG[comment.status] || STATUS_CFG.pending
              const busy = actionId === comment._id
              return (
                <Card key={comment._id} className={cn(comment.status === 'pending' && 'border-amber-200/70')}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(comment.user?.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{comment.user?.name || 'Người dùng'}</p>
                          <p className="truncate text-xs text-muted-foreground">{comment.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusConfig.cls}>{statusConfig.label}</Badge>
                        <span className="text-xs text-muted-foreground">{dayjs(comment.createdAt).fromNow()}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
                      {comment.content}
                    </div>

                    {comment.landlordReply?.content && (
                      <div className="ml-6 p-3.5 rounded-lg border-l-2 border-primary/30 bg-primary/5 dark:bg-primary/5/10 text-sm space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">Chủ trọ phản hồi:</span>
                          <span>{dayjs(comment.landlordReply.repliedAt).fromNow()}</span>
                        </div>
                        <p className="text-foreground leading-relaxed italic">“{comment.landlordReply.content}”</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {comment.room ? (
                        <Link to={`/rooms/${comment.room.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {comment.room.title}
                        </Link>
                      ) : <span className="text-xs text-muted-foreground">Phòng không còn tồn tại</span>}

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {comment.status !== 'approved' && (
                          <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-xs hover:bg-emerald-700" onClick={() => handleApprove(comment._id)} disabled={busy}>
                            <CheckCircle className="h-4 w-4" />
                            Duyệt
                          </Button>
                        )}
                        {comment.status !== 'rejected' && (
                          <Button variant="outline" size="sm" className="h-8 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleReject(comment._id)} disabled={busy}>
                            <XCircle className="h-4 w-4" />
                            Từ chối
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(comment)} disabled={busy}>
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            <AdminPagination page={page} totalPages={pagination.totalPages} total={pagination.total} label="bình luận" onChange={setPage} />
          </div>
        )}
      </AdminContent>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bình luận?</DialogTitle>
            <DialogDescription>
              Bình luận của {deleteTarget?.user?.name || 'người dùng'} sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={Boolean(actionId)}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
