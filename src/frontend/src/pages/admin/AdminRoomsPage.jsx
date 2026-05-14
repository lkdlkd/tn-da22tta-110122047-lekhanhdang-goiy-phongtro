import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Home,
  MapPin,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  adminApproveRoomApi,
  adminDeleteRoomApi,
  adminGetRoomsApi,
  adminHideRoomApi,
  adminRejectRoomApi,
  adminRestoreRoomApi,
} from '@/services/adminService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AdminContent, AdminPageHeader, AdminPagination, AdminTabs } from '@/pages/admin/components/AdminUI'

const STATUS_CFG = {
  approved: { label: 'Đã duyệt', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  pending: { label: 'Chờ duyệt', cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  rejected: { label: 'Từ chối', cls: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  flagged: { label: 'Vi phạm', cls: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
}

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'flagged', label: 'Vi phạm' },
]

const fmtVND = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
const fmtDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'

function formatAddress(address) {
  if (!address) return '—'
  if (typeof address === 'string') return address
  return address.fullAddress || [address.street, address.ward, address.district, address.city].filter(Boolean).join(', ') || '—'
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const searchTimeout = useRef(null)
  const LIMIT = 20

  const fetchRooms = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const res = await adminGetRoomsApi({
        status: statusFilter || undefined,
        search: search || undefined,
        page: pg,
        limit: LIMIT,
      })
      setRooms(res.data?.data?.rooms || [])
      setPagination(res.data?.data?.pagination || { total: 0, totalPages: 1 })
    } catch {
      toast.error('Không thể tải danh sách phòng')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => { setPage(1); fetchRooms(1) }, [statusFilter, search])
  useEffect(() => { fetchRooms(page) }, [page])

  const handleSearchChange = (value) => {
    setSearchInput(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setSearch(value), 500)
  }

  const updateRoomStatus = (id, patch) => {
    setRooms((prev) => prev.map((room) => room._id === id ? { ...room, ...patch } : room))
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await adminApproveRoomApi(id)
      updateRoomStatus(id, { status: 'approved' })
      toast.success('Đã duyệt phòng')
    } catch {
      toast.error('Lỗi khi duyệt phòng')
    } finally {
      setActionLoading('')
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActionLoading(rejectTarget._id)
    try {
      await adminRejectRoomApi(rejectTarget._id, rejectReason)
      updateRoomStatus(rejectTarget._id, { status: 'rejected' })
      toast.success('Đã từ chối phòng')
    } catch {
      toast.error('Lỗi khi từ chối phòng')
    } finally {
      setActionLoading('')
      setRejectTarget(null)
      setRejectReason('')
    }
  }

  const handleRestore = async (id) => {
    setActionLoading(id)
    try {
      await adminRestoreRoomApi(id)
      updateRoomStatus(id, { status: 'approved' })
      toast.success('Đã khôi phục phòng')
    } catch {
      toast.error('Lỗi khi khôi phục phòng')
    } finally {
      setActionLoading('')
    }
  }

  const handleHideOrDelete = async () => {
    if (!deleteTarget) return
    const { room, mode } = deleteTarget
    setActionLoading(room._id)
    try {
      if (mode === 'hide') {
        await adminHideRoomApi(room._id, deleteReason)
        updateRoomStatus(room._id, { status: 'flagged', isAvailable: false })
        toast.success('Đã ẩn phòng khỏi danh sách')
      } else {
        await adminDeleteRoomApi(room._id, deleteReason)
        setRooms((prev) => prev.filter((item) => item._id !== room._id))
        toast.success('Đã xóa phòng')
      }
    } catch {
      toast.error(mode === 'hide' ? 'Lỗi khi ẩn phòng' : 'Lỗi khi xóa phòng')
    } finally {
      setActionLoading('')
      setDeleteTarget(null)
      setDeleteReason('')
    }
  }

  const pendingCount = rooms.filter((room) => room.status === 'pending').length
  const flaggedCount = rooms.filter((room) => room.status === 'flagged').length

  return (
    <>
      <AdminPageHeader
        title="Phòng trọ"
        description="Kiểm duyệt, ẩn, khôi phục hoặc xóa phòng trọ trong hệ thống."
        icon={Home}
        meta={(
          <>
            <Badge variant="secondary">{pagination.total} phòng</Badge>
            {pendingCount > 0 && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{pendingCount} chờ duyệt</Badge>}
            {flaggedCount > 0 && <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">{flaggedCount} vi phạm</Badge>}
          </>
        )}
        onRefresh={() => fetchRooms(page)}
        refreshing={loading}
      />

      <AdminContent>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <AdminTabs
            value={statusFilter}
            onChange={setStatusFilter}
            items={STATUS_TABS.map((tab) => ({
              ...tab,
              count: tab.value === 'pending' ? pendingCount : tab.value === 'flagged' ? flaggedCount : 0,
            }))}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm tên phòng, địa chỉ, chủ trọ..."
              className="h-10 rounded-lg pl-9 lg:w-80"
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Phòng', 'Chủ trọ', 'Giá / loại', 'Ngày đăng', 'Trạng thái', 'Thao tác'].map((header) => (
                    <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:text-right">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><Skeleton className="h-14 w-20 rounded-lg" /><div className="space-y-2"><Skeleton className="h-4 w-52" /><Skeleton className="h-3 w-36" /></div></div></td>
                      <td className="px-5 py-3"><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></div></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-5 py-3"><Skeleton className="ml-auto h-8 w-32" /></td>
                    </tr>
                  ))
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-muted-foreground">
                      Không tìm thấy phòng phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => {
                    const status = STATUS_CFG[room.status] || STATUS_CFG.pending
                    const isFlagged = room.status === 'flagged'
                    return (
                      <tr key={room._id} className={cn('transition-colors hover:bg-muted/30', isFlagged && 'bg-orange-50/30 dark:bg-orange-950/10', room.status === 'rejected' && 'opacity-70')}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {room.images?.[0] ? (
                              <img src={room.images[0]} alt="" className="h-14 w-20 shrink-0 rounded-lg border object-cover" />
                            ) : (
                              <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <Home className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-semibold">{room.title}</p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="line-clamp-1">{formatAddress(room.address)}</span>
                              </p>
                              <Badge variant="outline" className={cn('mt-1 h-5 text-[10px]', room.isAvailable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'text-muted-foreground')}>
                                {room.isAvailable ? 'Còn trống' : 'Đã cho thuê'}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{room.landlord?.name || '—'}</p>
                          <p className="mt-1 break-all text-xs text-muted-foreground">{room.landlord?.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold">{fmtVND(room.price)}<span className="text-xs font-normal text-muted-foreground">/tháng</span></p>
                          <p className="mt-1 text-xs text-muted-foreground">{room.roomType?.replace(/_/g, ' ') || '—'}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">{fmtDate(room.createdAt)}</td>
                        <td className="px-5 py-3">

                          <Badge variant="outline" className={cn('mt-1 h-5 text-[10px]', status.cls)}>
                            {status.label}
                          </Badge>
                          {/* <Badge variant="outline" className={status.cls}>{status.label}</Badge> */}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild title="Xem phòng">
                              <Link to={`/rooms/${room.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                            </Button>
                            {room.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50" disabled={actionLoading === room._id} onClick={() => handleApprove(room._id)} title="Duyệt">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50" disabled={actionLoading === room._id} onClick={() => setRejectTarget(room)} title="Từ chối">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {isFlagged && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50" disabled={actionLoading === room._id} onClick={() => handleRestore(room._id)} title="Khôi phục">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {room.status === 'approved' && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-orange-600 hover:bg-orange-50" disabled={actionLoading === room._id} onClick={() => setDeleteTarget({ room, mode: 'hide' })} title="Ẩn phòng">
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50" disabled={actionLoading === room._id} onClick={() => setDeleteTarget({ room, mode: 'delete' })} title="Xóa phòng">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} totalPages={pagination.totalPages} total={pagination.total} label="phòng" onChange={setPage} />
        </Card>
      </AdminContent>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={() => { setRejectTarget(null); setRejectReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối phòng</DialogTitle>
            <DialogDescription>
              Phòng "{rejectTarget?.title}" sẽ bị từ chối. Chủ trọ sẽ nhận thông báo nếu hệ thống hỗ trợ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do từ chối</label>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Ví dụ: thông tin chưa đầy đủ, ảnh không phù hợp..."
              rows={3}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason('') }}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject} disabled={Boolean(actionLoading)}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => { setDeleteTarget(null); setDeleteReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deleteTarget?.mode === 'hide' ? <EyeOff className="h-5 w-5 text-orange-600" /> : <Trash2 className="h-5 w-5 text-red-600" />}
              {deleteTarget?.mode === 'hide' ? 'Ẩn phòng' : 'Xóa phòng'}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.mode === 'hide'
                ? `Phòng "${deleteTarget?.room?.title}" sẽ bị ẩn khỏi danh sách tìm kiếm.`
                : `Phòng "${deleteTarget?.room?.title}" sẽ bị xóa khỏi hệ thống.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do</label>
            <textarea
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Nhập lý do để lưu lại lịch sử xử lý..."
              rows={3}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteReason('') }}>Hủy</Button>
            <Button variant="destructive" onClick={handleHideOrDelete} disabled={Boolean(actionLoading)}>
              {deleteTarget?.mode === 'hide' ? <AlertTriangle className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
