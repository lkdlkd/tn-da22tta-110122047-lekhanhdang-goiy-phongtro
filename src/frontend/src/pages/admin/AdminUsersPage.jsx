import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Mail, Phone, Search, ShieldBan, ShieldCheck, Users } from 'lucide-react'
import dayjs from 'dayjs'
import { adminBanUserApi, adminGetUsersApi, adminUnbanUserApi } from '@/services/adminService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  AdminContent,
  AdminFilterPills,
  AdminPageHeader,
  AdminPagination,
  AdminTabs,
} from '@/pages/admin/components/AdminUI'

const ROLE_CFG = {
  student: {
    label: 'Sinh viên',
    badgeCls: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    avatarCls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  landlord: {
    label: 'Chủ trọ',
    badgeCls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    avatarCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  admin: {
    label: 'Admin',
    badgeCls: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    avatarCls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
}

const ROLE_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'student', label: 'Sinh viên' },
  { value: 'landlord', label: 'Chủ trọ' },
  { value: 'admin', label: 'Admin' },
]

const BAN_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'false', label: 'Đang hoạt động' },
  { value: 'true', label: 'Đã khóa' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [banFilter, setBanFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [actionLoading, setActionLoading] = useState('')
  const searchTimeout = useRef(null)
  const LIMIT = 20

  const fetchUsers = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: LIMIT }
      if (roleFilter) params.role = roleFilter
      if (banFilter !== '') params.isBanned = banFilter
      if (search) params.search = search
      const res = await adminGetUsersApi(params)
      setUsers(res.data?.data?.users || [])
      setPagination(res.data?.data?.pagination || { total: 0, totalPages: 1 })
    } catch {
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [roleFilter, banFilter, search, page])

  useEffect(() => { setPage(1); fetchUsers(1) }, [roleFilter, banFilter, search])
  useEffect(() => { fetchUsers(page) }, [page])

  const handleSearchChange = (value) => {
    setSearchInput(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setSearch(value), 500)
  }

  const handleBan = async (id, isBanned) => {
    setActionLoading(id)
    try {
      isBanned ? await adminUnbanUserApi(id) : await adminBanUserApi(id)
      setUsers((prev) => prev.map((user) => user._id === id ? { ...user, isBanned: !isBanned } : user))
      toast.success(isBanned ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
    } catch {
      toast.error('Thao tác thất bại')
    } finally {
      setActionLoading('')
    }
  }

  const bannedCount = users.filter((user) => user.isBanned).length

  return (
    <>
      <AdminPageHeader
        title="Người dùng"
        description="Quản lý tài khoản sinh viên, chủ trọ và quản trị viên trong hệ thống."
        icon={Users}
        meta={(
          <>
            <Badge variant="secondary">{pagination.total} tài khoản</Badge>
            {bannedCount > 0 && <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">{bannedCount} đang khóa</Badge>}
          </>
        )}
        onRefresh={() => fetchUsers(page)}
        refreshing={loading}
      />

      <AdminContent>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <AdminTabs value={roleFilter} onChange={setRoleFilter} items={ROLE_TABS} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm tên, email, số điện thoại..."
              className="h-10 rounded-lg pl-9 lg:w-80"
            />
          </div>
        </div>

        <AdminFilterPills value={banFilter} onChange={setBanFilter} items={BAN_OPTIONS} />

        {/* Mobile Cards Layout (hidden on desktop) */}
        <div className="grid gap-3.5 md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-full rounded-lg" />
              </Card>
            ))
          ) : users.length === 0 ? (
            <Card className="py-14 text-center text-muted-foreground">
              Không có người dùng phù hợp với bộ lọc.
            </Card>
          ) : (
            users.map((user) => {
              const role = ROLE_CFG[user.role] || ROLE_CFG.student
              return (
                <Card key={user._id} className={cn(
                  'p-4 space-y-3.5 transition-all duration-300 hover:shadow-sm',
                  user.isBanned && 'bg-red-50/20 opacity-80 dark:bg-red-950/5 border-l-4 border-l-red-500'
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-bold', role.avatarCls)}>
                        {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">ID: {user._id.slice(-6)} · {dayjs(user.createdAt).format('DD/MM/YYYY')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={role.badgeCls}>{role.label}</Badge>
                  </div>

                  <div className="space-y-1.5 border-t pt-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
                      <a href={`mailto:${user.email}`} className="break-all font-medium text-foreground hover:text-primary hover:underline">{user.email}</a>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
                        <a href={`tel:${user.phone}`} className="font-medium text-foreground hover:text-primary hover:underline">{user.phone}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Trạng thái:</span>
                      {user.isEmailVerified ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 h-4.5 px-1.5 font-semibold">
                          Đã xác minh
                        </Badge>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground/80">Chưa xác minh</span>
                      )}
                      {user.isBanned && (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-700 h-4.5 px-1.5 font-semibold">
                          Đang khóa
                        </Badge>
                      )}
                    </div>
                  </div>

                  {user.role !== 'admin' && (
                    <div className="border-t pt-3 flex justify-end">
                      <Button
                        variant={user.isBanned ? 'outline' : 'ghost'}
                        size="sm"
                        className={cn(
                          'h-8 rounded-lg text-xs font-semibold px-3.5 flex-1 sm:flex-initial',
                          !user.isBanned && 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20'
                        )}
                        disabled={actionLoading === user._id}
                        onClick={() => handleBan(user._id, user.isBanned)}
                      >
                        {user.isBanned ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Mở khóa tài khoản
                          </>
                        ) : (
                          <>
                            <ShieldBan className="h-3.5 w-3.5 mr-1" />
                            Khóa tài khoản
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Desktop Table Layout (hidden on mobile) */}
        <Card className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Người dùng', 'Liên hệ', 'Vai trò', 'Ngày tham gia', 'Xác minh', 'Thao tác'].map((header) => (
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
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                      <td className="px-5 py-3"><div className="space-y-2"><Skeleton className="h-3 w-44" /><Skeleton className="h-3 w-28" /></div></td>
                      <td className="px-5 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                      <td className="px-5 py-3 text-right"><Skeleton className="ml-auto h-8 w-24" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-muted-foreground">
                      Không có người dùng phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const role = ROLE_CFG[user.role] || ROLE_CFG.student
                    return (
                      <tr key={user._id} className={cn('transition-colors hover:bg-muted/30', user.isBanned && 'bg-red-50/30 opacity-75 dark:bg-red-950/10')}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-bold', role.avatarCls)}>
                              {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user.name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold leading-snug">{user.name}</p>
                              {user.isBanned && <Badge variant="outline" className="mt-1 h-5 border-red-200 bg-red-50 text-[10px] text-red-700">Đã khóa</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="space-y-1 px-5 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="break-all">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={role.badgeCls}>{role.label}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">
                          {dayjs(user.createdAt).format('DD/MM/YYYY')}
                        </td>
                        <td className="px-5 py-3">
                          {user.isEmailVerified
                            ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Đã xác minh</Badge>
                            : <span className="text-xs text-muted-foreground">Chưa xác minh</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {user.role !== 'admin' && (
                            <Button
                              variant={user.isBanned ? 'outline' : 'ghost'}
                              size="sm"
                              className={cn('h-8 rounded-lg text-xs', !user.isBanned && 'text-red-600 hover:bg-red-50 hover:text-red-700')}
                              disabled={actionLoading === user._id}
                              onClick={() => handleBan(user._id, user.isBanned)}
                            >
                              {user.isBanned ? <ShieldCheck className="h-4 w-4" /> : <ShieldBan className="h-4 w-4" />}
                              {user.isBanned ? 'Mở khóa' : 'Khóa'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} totalPages={pagination.totalPages} total={pagination.total} label="tài khoản" onChange={setPage} />
        </Card>
      </AdminContent>
    </>
  )
}
