import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Home,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Shield,
  Sparkles,
  User,
} from 'lucide-react'
import { changePasswordApi, getProfileApi, updateProfileApi } from '@/services/userService'
import { getFavoritesApi } from '@/services/favoriteService'
import { getRecentlyViewedApi } from '@/services/interactionService'
import { RoomCard, RoomCardSkeleton } from '@/components/rooms/RoomCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const ROLE_LABEL = { student: 'Sinh viên', landlord: 'Chủ trọ', admin: 'Quản trị viên' }
const ROLE_TONE = {
  student: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  landlord: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  admin: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}
const ROLE_ICON = { student: User, landlord: Building2, admin: Shield }

function AvatarUpload({ avatarUrl, name, onFile }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(avatarUrl || null)

  useEffect(() => setPreview(avatarUrl || null), [avatarUrl])

  const handleChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB')
      return
    }
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted text-3xl font-bold text-primary">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : (name || '?')[0].toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-primary shadow-sm hover:bg-muted"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG · tối đa 5MB</p>
    </div>
  )
}

function Field({ label, icon: Icon, id, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <Skeleton className="h-80 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function RoomGrid({ loading, rooms, emptyTitle, emptyText }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <RoomCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!rooms.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">{emptyTitle}</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{emptyText}</p>
          </div>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/search"><Search className="h-4 w-4" />Tìm phòng</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => <RoomCard key={room._id} room={room} showViewButton={false} />)}
    </div>
  )
}

export default function ProfilePage() {
  const authUser = useSelector((state) => state.auth?.user)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', preferences: { maxPrice: '', minArea: '', district: '' } })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [favRooms, setFavRooms] = useState([])
  const [loadingFavs, setLoadingFavs] = useState(false)
  const [recentRooms, setRecentRooms] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  useEffect(() => {
    getProfileApi()
      .then((res) => {
        const profile = res.data?.data?.user
        if (!profile) {
          setError('Không tải được hồ sơ')
          return
        }
        setUser(profile)
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          preferences: {
            maxPrice: profile.preferences?.maxPrice || '',
            minArea: profile.preferences?.minArea || '',
            district: profile.preferences?.district || '',
          },
        })
      })
      .catch((err) => {
        const message = err.response?.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : 'Không thể tải hồ sơ.'
        setError(message)
        toast.error(message)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadFavs = () => {
    if (loadingFavs || favRooms.length) return
    setLoadingFavs(true)
    getFavoritesApi()
      .then((res) => setFavRooms(res.data?.data?.rooms || []))
      .catch(() => toast.error('Không thể tải yêu thích'))
      .finally(() => setLoadingFavs(false))
  }

  const loadRecent = () => {
    if (loadingRecent || recentRooms.length) return
    setLoadingRecent(true)
    getRecentlyViewedApi(10)
      .then((res) => setRecentRooms(res.data?.data?.rooms || []))
      .catch(() => toast.error('Không thể tải lịch sử xem'))
      .finally(() => setLoadingRecent(false))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Tên không được để trống')
      return
    }
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      payload.append('phone', form.phone.trim())
      payload.append('preferences', JSON.stringify({
        maxPrice: Number(form.preferences.maxPrice) || null,
        minArea: Number(form.preferences.minArea) || null,
        district: form.preferences.district.trim() || null,
      }))
      if (avatarFile) payload.append('avatar', avatarFile)
      const res = await updateProfileApi(payload)
      const updated = res.data?.data?.user
      if (updated) {
        setUser(updated)
        setForm({
          name: updated.name || '',
          phone: updated.phone || '',
          preferences: {
            maxPrice: updated.preferences?.maxPrice || '',
            minArea: updated.preferences?.minArea || '',
            district: updated.preferences?.district || '',
          },
        })
      }
      setAvatarFile(null)
      toast.success('Cập nhật hồ sơ thành công')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Vui lòng điền đầy đủ')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Mật khẩu mới không khớp')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Mật khẩu ít nhất 6 ký tự')
      return
    }
    setSaving(true)
    try {
      await changePasswordApi({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Đổi mật khẩu thành công')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mật khẩu hiện tại không đúng')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <ProfileSkeleton />

  if (error || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="font-semibold">Không thể tải hồ sơ</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error || 'Phiên đăng nhập có thể đã hết hạn.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>Thử lại</Button>
          <Button asChild><Link to="/login">Đăng nhập lại</Link></Button>
        </div>
      </div>
    )
  }

  const RoleIcon = ROLE_ICON[user.role] || User

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-5 text-center">
              <AvatarUpload avatarUrl={user.avatar} name={user.name} onFile={setAvatarFile} />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">{user.name}</h1>
                <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className={cn('border', ROLE_TONE[user.role])}>
                  <RoleIcon className="mr-1 h-3.5 w-3.5" />
                  {ROLE_LABEL[user.role] || user.role}
                </Badge>
                {user.isEmailVerified && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Đã xác minh
                  </Badge>
                )}
              </div>
              <Separator />
              <div className="grid w-full gap-2 text-left text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /><span className="truncate">{user.email}</span></div>
                {user.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span>{user.phone}</span></div>}
                <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span>Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span></div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0">
          <Tabs defaultValue="info" onValueChange={(value) => {
            if (value === 'favorites') loadFavs()
            if (value === 'recent') loadRecent()
          }}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1 sm:grid-cols-4">
              <TabsTrigger value="info" className="rounded-md"><User className="mr-1.5 h-3.5 w-3.5" />Thông tin</TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-md"><Heart className="mr-1.5 h-3.5 w-3.5" />Yêu thích</TabsTrigger>
              <TabsTrigger value="recent" className="rounded-md"><Eye className="mr-1.5 h-3.5 w-3.5" />Đã xem</TabsTrigger>
              <TabsTrigger value="security" className="rounded-md"><KeyRound className="mr-1.5 h-3.5 w-3.5" />Bảo mật</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-5">
              <form onSubmit={handleSave} className="space-y-5">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Thông tin cá nhân</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Họ và tên" icon={User} id="profile-name">
                        <Input id="profile-name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                      </Field>
                      <Field label="Số điện thoại" icon={Phone} id="profile-phone">
                        <Input id="profile-phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="0901 234 567" />
                      </Field>
                    </div>
                    <Field label="Email" icon={Mail} id="profile-email" hint="Email không thể thay đổi">
                      <Input id="profile-email" value={user.email} disabled className="opacity-70" />
                    </Field>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Sở thích tìm phòng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <Field label="Giá tối đa" id="pref-price">
                      <Input id="pref-price" type="number" min="0" value={form.preferences.maxPrice} onChange={(event) => setForm((prev) => ({ ...prev, preferences: { ...prev.preferences, maxPrice: event.target.value } }))} placeholder="3000000" />
                    </Field>
                    <Field label="Diện tích tối thiểu" id="pref-area">
                      <Input id="pref-area" type="number" min="0" value={form.preferences.minArea} onChange={(event) => setForm((prev) => ({ ...prev, preferences: { ...prev.preferences, minArea: event.target.value } }))} placeholder="15" />
                    </Field>
                    <Field label="Khu vực ưu tiên" icon={MapPin} id="pref-district">
                      <Input id="pref-district" value={form.preferences.district} onChange={(event) => setForm((prev) => ({ ...prev, preferences: { ...prev.preferences, district: event.target.value } }))} placeholder="Vĩnh Long" />
                    </Field>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="rounded-lg">
                    <Save className="h-4 w-4" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="favorites" className="mt-5">
              <RoomGrid loading={loadingFavs} rooms={favRooms} emptyTitle="Chưa có phòng yêu thích" emptyText="Nhấn trái tim ở trang chi tiết phòng để lưu vào đây." />
            </TabsContent>

            <TabsContent value="recent" className="mt-5">
              <RoomGrid loading={loadingRecent} rooms={recentRooms} emptyTitle="Chưa xem phòng nào" emptyText="Các phòng bạn đã xem sẽ xuất hiện ở đây để quay lại nhanh hơn." />
            </TabsContent>

            <TabsContent value="security" className="mt-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5 text-primary" />Đổi mật khẩu</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                    {[
                      { id: 'current-password', label: 'Mật khẩu hiện tại', key: 'currentPassword', showKey: 'current', ac: 'current-password' },
                      { id: 'new-password', label: 'Mật khẩu mới', key: 'newPassword', showKey: 'new', ac: 'new-password' },
                      { id: 'confirm-password', label: 'Xác nhận mật khẩu mới', key: 'confirmPassword', showKey: 'confirm', ac: 'new-password' },
                    ].map((item) => (
                      <div key={item.id} className="space-y-1.5">
                        <Label htmlFor={item.id}>{item.label}</Label>
                        <div className="relative">
                          <Input
                            id={item.id}
                            type={showPw[item.showKey] ? 'text' : 'password'}
                            autoComplete={item.ac}
                            value={pwForm[item.key]}
                            onChange={(event) => setPwForm((prev) => ({ ...prev, [item.key]: event.target.value }))}
                            className="pr-10"
                          />
                          <button type="button" onClick={() => setShowPw((prev) => ({ ...prev, [item.showKey]: !prev[item.showKey] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPw[item.showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button type="submit" disabled={saving} className="rounded-lg">
                      <Shield className="h-4 w-4" />
                      {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
