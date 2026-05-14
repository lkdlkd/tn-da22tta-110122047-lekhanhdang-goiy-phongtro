import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import {
  ArrowLeft,
  Bath,
  Camera,
  Car,
  ChefHat,
  CheckCircle2,
  FileText,
  Flame,
  Home,
  Image as ImageIcon,
  MapPinned,
  Package,
  Save,
  ShieldCheck,
  Sofa,
  Trees,
  Upload,
  Video,
  WashingMachine,
  Wifi,
  Wind,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { createRoomApi, getRoomByIdApi, updateRoomApi } from '@/services/roomService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { LandlordContent, LandlordPageHeader, StatusBadge } from './components/LandlordUI'
import { cn } from '@/lib/utils'

const roomTypeOptions = [
  { value: 'phòng_trọ', label: 'Phòng trọ' },
  { value: 'chung_cư_mini', label: 'Chung cư mini' },
  { value: 'nhà_nguyên_căn', label: 'Nhà nguyên căn' },
  { value: 'ký_túc_xá', label: 'Ký túc xá' },
]

const amenityOptions = [
  { value: 'wifi', label: 'Wifi', icon: Wifi },
  { value: 'điều_hòa', label: 'Điều hòa', icon: Wind },
  { value: 'nóng_lạnh', label: 'Nóng lạnh', icon: Flame },
  { value: 'tủ_lạnh', label: 'Tủ lạnh', icon: Package },
  { value: 'máy_giặt', label: 'Máy giặt', icon: WashingMachine },
  { value: 'bếp', label: 'Bếp', icon: ChefHat },
  { value: 'chỗ_để_xe', label: 'Chỗ để xe', icon: Car },
  { value: 'an_ninh', label: 'An ninh', icon: ShieldCheck },
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'ban_công', label: 'Ban công', icon: Trees },
  { value: 'nội_thất', label: 'Nội thất', icon: Sofa },
  { value: 'vệ_sinh_riêng', label: 'Vệ sinh riêng', icon: Bath },
  { value: 'điện_nước_riêng', label: 'Điện nước riêng', icon: Zap },
]

function LocationPicker({ value, onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  if (!value) return null
  return <CircleMarker center={[value.lat, value.lng]} radius={10} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9, weight: 2 }} />
}

function MapViewport({ location }) {
  const map = useMap()
  useEffect(() => {
    if (!location) return
    map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.5 })
  }, [location, map])
  return null
}

async function reverseGeocodeLocation(lat, lng) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`)
  if (!response.ok) throw new Error('Không thể xác định địa chỉ từ vị trí đã chọn')
  const data = await response.json()
  const fullAddress = (data.display_name || '').replace(/,\s*Việt Nam$/i, '').trim()
  return { fullAddress }
}

function FormSection({ number, title, description, icon: Icon, children }) {
  return (
    <Card>
      <CardHeader className="p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-sm font-bold">
            {number}
          </div>
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              {Icon && <Icon className="h-4 w-4 text-primary" />}
              {title}
            </CardTitle>
            {description && <CardDescription className="mt-1 leading-6">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">{children}</CardContent>
    </Card>
  )
}

function MediaPicker({ id, label, description, icon: Icon, accept, multiple = true, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Chọn tệp</p>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <Upload className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => onChange(Array.from(event.target.files || []))}
        />
      </label>
    </div>
  )
}

function ImagePreviewList({ title, urls, onRemove }) {
  if (!urls.length) return null
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {urls.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-lg border bg-muted">
            <img src={url} alt="" className="h-32 w-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute right-2 top-2 h-8 w-8 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoPreviewList({ title, urls, onRemove }) {
  if (!urls.length) return null
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {urls.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-lg border bg-muted">
            <video src={url} controls className="h-44 w-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute right-2 top-2 h-8 w-8 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RoomFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    capacity: '1',
    roomType: 'phòng_trọ',
    address: '',
    isAvailable: true,
    amenities: [],
    location: null,
  })
  const [existingImages, setExistingImages] = useState([])
  const [existingImages360, setExistingImages360] = useState([])
  const [existingVideos, setExistingVideos] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [image360Files, setImage360Files] = useState([])
  const [videoFiles, setVideoFiles] = useState([])

  const imagePreviewUrls = useMemo(() => imageFiles.map((file) => URL.createObjectURL(file)), [imageFiles])
  const image360PreviewUrls = useMemo(() => image360Files.map((file) => URL.createObjectURL(file)), [image360Files])
  const videoPreviewUrls = useMemo(() => videoFiles.map((file) => URL.createObjectURL(file)), [videoFiles])

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      image360PreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      videoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviewUrls, image360PreviewUrls, videoPreviewUrls])

  useEffect(() => {
    if (!isEditMode) return

    const fetchRoom = async () => {
      try {
        setLoading(true)
        const res = await getRoomByIdApi(id)
        const room = res.data?.data?.room
        if (!room) return
        const [lng, lat] = room.location?.coordinates || []

        setForm({
          title: room.title || '',
          description: room.description || '',
          price: String(room.price || ''),
          area: String(room.area || ''),
          capacity: String(room.capacity || 1),
          roomType: room.roomType || 'phòng_trọ',
          address: typeof room.address === 'string'
            ? room.address
            : room.address?.fullAddress || [room.address?.street, room.address?.ward, room.address?.district, room.address?.city].filter(Boolean).join(', ') || '',
          isAvailable: room.isAvailable ?? true,
          amenities: room.amenities || [],
          location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
        })
        setExistingImages(room.images || [])
        setExistingImages360(room.images360 || [])
        setExistingVideos(room.videos || [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải dữ liệu phòng')
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [id, isEditMode])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const toggleAmenity = (value) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter((item) => item !== value)
        : [...prev.amenities, value],
    }))
  }

  const applyLocationSelection = async (location) => {
    setForm((prev) => ({ ...prev, location }))
    try {
      const resolved = await reverseGeocodeLocation(location.lat, location.lng)
      setForm((prev) => ({ ...prev, location, address: resolved.fullAddress }))
    } catch (error) {
      toast.error(error.message || 'Không thể tự động điền địa chỉ từ vị trí')
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ lấy vị trí hiện tại')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await applyLocationSelection({ lat: position.coords.latitude, lng: position.coords.longitude })
        } finally {
          setLocationLoading(false)
        }
      },
      (error) => {
        if (error.code === 1) toast.error('Quyền vị trí đang bị tắt. Vui lòng cấp quyền trong trình duyệt.')
        else if (error.code === 2) toast.error('Không xác định được vị trí. Kiểm tra GPS hoặc kết nối mạng.')
        else if (error.code === 3) toast.error('Hết thời gian lấy vị trí. Vui lòng thử lại.')
        else toast.error('Không thể lấy vị trí hiện tại')
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.location) {
      toast.error('Vui lòng chọn vị trí trên bản đồ')
      return
    }

    try {
      setSaving(true)
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('price', form.price)
      payload.append('area', form.area)
      payload.append('capacity', form.capacity)
      payload.append('roomType', form.roomType)
      payload.append('address', form.address)
      payload.append('lat', String(form.location.lat))
      payload.append('lng', String(form.location.lng))
      payload.append('isAvailable', String(form.isAvailable))
      payload.append('amenities', JSON.stringify(form.amenities))
      payload.append('images', JSON.stringify(existingImages))
      payload.append('images360', JSON.stringify(existingImages360))
      payload.append('videos', JSON.stringify(existingVideos))
      imageFiles.forEach((file) => payload.append('images', file))
      image360Files.forEach((file) => payload.append('images360', file))
      videoFiles.forEach((file) => payload.append('videos', file))

      if (isEditMode) {
        await updateRoomApi(id, payload)
        toast.success('Cập nhật phòng thành công')
      } else {
        await createRoomApi(payload)
        toast.success('Đăng tin phòng thành công')
      }
      navigate('/landlord/rooms')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu phòng thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <LandlordPageHeader title={isEditMode ? 'Chỉnh sửa phòng' : 'Đăng phòng mới'} description="Đang tải dữ liệu phòng..." icon={Home} />
        <LandlordContent className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {[0, 1, 2].map((item) => (
              <Card key={item}>
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                  <Skeleton className="h-28" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-72 rounded-lg" />
        </LandlordContent>
      </div>
    )
  }

  const completedItems = [
    form.title,
    form.price,
    form.area,
    form.address,
    form.location,
    form.description,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-muted/20">
      <LandlordPageHeader
        title={isEditMode ? 'Chỉnh sửa phòng' : 'Đăng phòng mới'}
        description="Điền thông tin chính xác, thêm ảnh rõ ràng và ghim đúng vị trí để sinh viên dễ tìm thấy phòng."
        icon={Home}
        meta={<StatusBadge status={form.isAvailable ? 'available' : 'rented'} type="availability" />}
        action={(
          <Button variant="outline" className="h-9 rounded-lg" asChild>
            <Link to="/landlord/rooms">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        )}
      />

      <LandlordContent className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form id="room-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection number="1" title="Thông tin cơ bản" description="Tên phòng, loại hình, giá thuê và mô tả ngắn gọn." icon={FileText}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Tên phòng <span className="text-destructive">*</span></Label>
                <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="VD: Phòng trọ sạch sẽ gần Đại học Cửu Long" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomType">Loại phòng</Label>
                <select
                  id="roomType"
                  name="roomType"
                  value={form.roomType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {roomTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái phòng</Label>
                <label className="flex h-10 cursor-pointer items-center justify-between rounded-md border bg-background px-3 text-sm">
                  <span>{form.isAvailable ? 'Còn trống' : 'Đã cho thuê'}</span>
                  <input name="isAvailable" type="checkbox" checked={form.isAvailable} onChange={handleChange} className="h-4 w-4 accent-primary" />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Giá thuê (VND/tháng) <span className="text-destructive">*</span></Label>
                <Input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="VD: 2500000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Diện tích (m²) <span className="text-destructive">*</span></Label>
                <Input id="area" name="area" type="number" min="1" value={form.area} onChange={handleChange} placeholder="VD: 25" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Sức chứa <span className="text-destructive">*</span></Label>
                <Input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Mô tả chi tiết <span className="text-destructive">*</span></Label>
                <Textarea id="description" name="description" rows={5} value={form.description} onChange={handleChange} placeholder="Mô tả về phòng, khu vực, tiện ích xung quanh..." required />
              </div>
            </div>
          </FormSection>

          <FormSection number="2" title="Địa chỉ và bản đồ" description="Ghim vị trí trên bản đồ để kết quả tìm kiếm chính xác hơn." icon={MapPinned}>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="rounded-lg" onClick={handleUseCurrentLocation} disabled={locationLoading}>
                <MapPinned className="h-4 w-4" />
                {locationLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
              </Button>
              {form.location && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ đầy đủ <span className="text-destructive">*</span></Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="VD: 123 Nguyễn Huệ, Phường 1, Vĩnh Long" required />
            </div>

            <div className="overflow-hidden rounded-lg border">
              <MapContainer
                center={form.location ? [form.location.lat, form.location.lng] : [10.2547, 105.9722]}
                zoom={13}
                className="h-[360px] w-full"
              >
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapViewport location={form.location} />
                <LocationPicker value={form.location} onPick={applyLocationSelection} />
              </MapContainer>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Click trực tiếp lên bản đồ để ghim vị trí phòng. Địa chỉ sẽ được tự động gợi ý nếu dịch vụ bản đồ phản hồi.</p>
          </FormSection>

          <FormSection number="3" title="Tiện ích" description="Chọn những tiện ích thật sự có trong phòng." icon={Wifi}>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Đã chọn {form.amenities.length}</Badge>
              {form.amenities.length > 0 && (
                <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setForm((prev) => ({ ...prev, amenities: [] }))}>
                  Bỏ chọn tất cả
                </Button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {amenityOptions.map((amenity) => {
                const Icon = amenity.icon
                const selected = form.amenities.includes(amenity.value)
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={cn(
                      'flex h-10 items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors',
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/40'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{amenity.label}</span>
                  </button>
                )
              })}
            </div>
          </FormSection>

          <FormSection number="4" title="Ảnh và video" description="Ảnh sáng, rõ và đúng thực tế giúp tin đăng đáng tin hơn." icon={ImageIcon}>
            <div className="grid gap-4 lg:grid-cols-3">
              <MediaPicker id="images" label="Ảnh thường" description="PNG, JPG, WEBP. Có thể chọn nhiều ảnh." icon={ImageIcon} accept="image/*" onChange={setImageFiles} />
              <MediaPicker id="images360" label="Ảnh 360" description="Ảnh panorama toàn cảnh phòng." icon={Camera} accept="image/*" onChange={setImage360Files} />
              <MediaPicker id="videos" label="Video" description="MP4, MOV, WEBM. Tối đa 3 video." icon={Video} accept="video/mp4,video/quicktime,video/webm,video/x-msvideo" onChange={setVideoFiles} />
            </div>

            <Separator />

            <ImagePreviewList title="Ảnh đã lưu" urls={existingImages} onRemove={(index) => setExistingImages((prev) => prev.filter((_, i) => i !== index))} />
            <ImagePreviewList title="Ảnh 360 đã lưu" urls={existingImages360} onRemove={(index) => setExistingImages360((prev) => prev.filter((_, i) => i !== index))} />
            <VideoPreviewList title="Video đã lưu" urls={existingVideos} onRemove={(index) => setExistingVideos((prev) => prev.filter((_, i) => i !== index))} />
            <ImagePreviewList title="Ảnh mới" urls={imagePreviewUrls} onRemove={(index) => setImageFiles((prev) => prev.filter((_, i) => i !== index))} />
            <ImagePreviewList title="Ảnh 360 mới" urls={image360PreviewUrls} onRemove={(index) => setImage360Files((prev) => prev.filter((_, i) => i !== index))} />
            <VideoPreviewList title="Video mới" urls={videoPreviewUrls} onRemove={(index) => setVideoFiles((prev) => prev.filter((_, i) => i !== index))} />
          </FormSection>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base">Tóm tắt tin đăng</CardTitle>
              <CardDescription>Kiểm tra nhanh trước khi lưu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="line-clamp-2 font-semibold">{form.title || 'Chưa nhập tên phòng'}</p>
                <p className="mt-1 text-sm text-primary">{form.price ? `${Number(form.price).toLocaleString('vi-VN')} đ/tháng` : 'Chưa nhập giá'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{form.area || 0} m² · {form.capacity || 1} người</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Tiến độ thông tin</span>
                  <span className="font-semibold">{completedItems}/6</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${(completedItems / 6) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ảnh thường</span>
                  <span className="font-semibold">{existingImages.length + imageFiles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ảnh 360</span>
                  <span className="font-semibold">{existingImages360.length + image360Files.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Video</span>
                  <span className="font-semibold">{existingVideos.length + videoFiles.length}</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Button type="submit" form="room-form" disabled={saving} className="rounded-lg">
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Đăng phòng'}
                </Button>
                <Button type="button" variant="outline" className="rounded-lg" asChild>
                  <Link to="/landlord/rooms">Huỷ</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </LandlordContent>
    </div>
  )
}
