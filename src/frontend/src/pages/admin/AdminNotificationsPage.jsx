import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Bell, Search, Send, User, X, Check } from 'lucide-react'
import { adminGetUsersApi, adminSendNotificationApi } from '@/services/adminService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AdminContent, AdminPageHeader } from '@/pages/admin/components/AdminUI'
import { cn } from '@/lib/utils'

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [target, setTarget] = useState('all')

  // Search specific user
  const [searchQuery, setSearchQuery] = useState('')
  const [foundUsers, setFoundUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Fetch users when searchQuery changes
  useEffect(() => {
    if (target !== 'specific' || !searchQuery.trim()) {
      setFoundUsers([])
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await adminGetUsersApi({ search: searchQuery, limit: 5 })
        setFoundUsers(res.data?.data?.users || [])
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery, target])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo')
      return
    }
    if (!body.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo')
      return
    }
    if (target === 'specific' && !selectedUser) {
      toast.error('Vui lòng chọn một người dùng cụ thể')
      return
    }

    setSending(true)
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        target,
        link: link.trim() || undefined,
        userId: target === 'specific' ? selectedUser._id : undefined,
      }

      const res = await adminSendNotificationApi(payload)
      if (res.data?.success) {
        toast.success(res.data?.message || 'Đã gửi thông báo thành công!')
        // Reset form
        setTitle('')
        setBody('')
        setLink('')
        setTarget('all')
        setSelectedUser(null)
        setSearchQuery('')
      } else {
        toast.error(res.data?.message || 'Không thể gửi thông báo')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi thông báo thất bại')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Gửi thông báo"
        description="Gửi thông báo hệ thống trực tiếp hoặc gửi toàn bộ thành viên trong hệ thống."
        icon={Bell}
        onRefresh={() => {
          setTitle('')
          setBody('')
          setLink('')
          setTarget('all')
          setSelectedUser(null)
          setSearchQuery('')
        }}
      />

      <AdminContent>
        <div className="max-w-2xl">
          <Card className="border-muted/60">
            <CardContent className="p-6">
              <form onSubmit={handleSend} className="space-y-5">
                {/* Target Select */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Đối tượng nhận thông báo</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'student', label: 'Sinh viên' },
                      { id: 'landlord', label: 'Chủ trọ' },
                      { id: 'specific', label: 'Cá nhân' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTarget(opt.id)
                          if (opt.id !== 'specific') {
                            setSelectedUser(null)
                            setSearchQuery('')
                          }
                        }}
                        className={cn(
                          'flex h-10 items-center justify-center rounded-xl border text-xs font-bold transition-all',
                          target === opt.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background hover:bg-muted text-muted-foreground border-input'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific User Select UI */}
                {target === 'specific' && (
                  <div className="space-y-3 rounded-xl border border-muted/80 bg-muted/20 p-4 transition-all duration-300">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chọn người nhận</label>
                    {selectedUser ? (
                      <div className="flex items-center justify-between rounded-lg border bg-background p-2.5">
                        <div className="flex items-center gap-3">
                          {selectedUser.avatar ? (
                            <img
                              src={selectedUser.avatar}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                              {(selectedUser.name || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 text-left">
                            <p className="text-sm font-bold leading-none">{selectedUser.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(null)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Nhập tên, email hoặc SĐT người nhận..."
                          className="pl-9 rounded-xl h-9"
                        />
                        {/* Search dropdown results */}
                        {searchQuery.trim() && (
                          <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border bg-background shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                            {searching ? (
                              <div className="p-3 text-center text-xs text-muted-foreground">Đang tìm kiếm...</div>
                            ) : foundUsers.length === 0 ? (
                              <div className="p-3 text-center text-xs text-muted-foreground">Không tìm thấy người dùng</div>
                            ) : (
                              foundUsers.map((user) => (
                                <button
                                  key={user._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setSearchQuery('')
                                    setFoundUsers([])
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-0"
                                >
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt=""
                                      className="h-8 w-8 rounded-full object-cover border shrink-0"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                      {(user.name || 'U')[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                                      <Badge variant="outline" className="text-[10px] scale-90 px-1 py-0 h-4 border-muted">
                                        {user.role === 'student' ? 'SV' : user.role === 'landlord' ? 'Chủ trọ' : 'Admin'}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Title Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Tiêu đề thông báo</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề ngắn gọn..."
                    className="rounded-xl h-10"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Body Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Nội dung thông báo</label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Nhập chi tiết nội dung thông báo..."
                    className="rounded-xl"
                    rows={5}
                    maxLength={1000}
                    required
                  />
                </div>

                {/* Link Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                    Liên kết điều hướng <span className="text-xs font-normal text-muted-foreground">(Tùy chọn)</span>
                  </label>
                  <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Ví dụ: /rooms, /appointments, /profile..."
                    className="rounded-xl h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Khi người nhận bấm vào thông báo, họ sẽ được chuyển hướng tới trang này.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-4">
                  <Button
                    type="submit"
                    disabled={sending}
                    className="h-10 rounded-xl px-5 font-bold shadow-md shadow-primary/20 w-full sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminContent>
    </>
  )
}
