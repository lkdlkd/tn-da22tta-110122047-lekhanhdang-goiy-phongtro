import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GitCompare,
  MapPin,
  Wifi,
  Wind,
  Flame,
  Package,
  WashingMachine,
  ChefHat,
  Car,
  ShieldCheck,
  Camera,
  Trees,
  Sofa,
  Bath,
  Zap,
  ArrowUp,
  X,
  ExternalLink,
  Heart,
  Check,
  Home,
  Trash2,
  Maximize2,
} from 'lucide-react'
import { toast } from 'sonner'
import { compareRoomsApi } from '@/services/compareService'
import { useCompareStore } from '@/store/compareStore'
import { FavoriteButton } from '@/components/rooms/FavoriteButton'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LocationPickerDialog } from '@/components/common/LocationPickerDialog'

const amenityConfig = {
  wifi: { label: 'Wifi', icon: Wifi },
  'điều_hòa': { label: 'Điều hòa', icon: Wind },
  'nóng_lạnh': { label: 'Nóng lạnh', icon: Flame },
  'tủ_lạnh': { label: 'Tủ lạnh', icon: Package },
  'máy_giặt': { label: 'Máy giặt', icon: WashingMachine },
  bếp: { label: 'Bếp', icon: ChefHat },
  'chỗ_để_xe': { label: 'Chỗ để xe', icon: Car },
  'an_ninh': { label: 'An ninh', icon: ShieldCheck },
  camera: { label: 'Camera', icon: Camera },
  'thang_máy': { label: 'Thang máy', icon: ArrowUp },
  'ban_công': { label: 'Ban công', icon: Trees },
  'nội_thất': { label: 'Nội thất', icon: Sofa },
  'vệ_sinh_riêng': { label: 'Vệ sinh riêng', icon: Bath },
  'điện_nước_riêng': { label: 'Điện nước riêng', icon: Zap },
}
const ALL_AMENITIES = Object.keys(amenityConfig)

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0)
}

function Row({ label, children, className }) {
  return (
    <tr className={cn('border-b last:border-0 hover:bg-muted/10 transition-colors', className)}>
      <td className="w-40 shrink-0 bg-muted/20 px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide align-middle border-r">
        {label}
      </td>
      {children}
    </tr>
  )
}

function Cell({ children, highlight, className }) {
  return (
    <td className={cn('px-5 py-4 align-middle text-sm border-r last:border-r-0', highlight && 'bg-primary/5 font-medium', className)}>
      {children}
    </td>
  )
}

export default function ComparePage() {
  const navigate = useNavigate()
  const { rooms: compareList, removeRoom, clearRooms } = useCompareStore()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)

  useEffect(() => {
    if (compareList.length < 2) return
    setLoading(true)
    const ids = compareList.map((r) => r._id)
    compareRoomsApi(ids, userLocation?.lat, userLocation?.lng)
      .then((res) => setRooms(res.data?.data?.rooms || []))
      .catch(() => toast.error('Không thể tải dữ liệu so sánh'))
      .finally(() => setLoading(false))
  }, [compareList, userLocation])

  if (compareList.length < 2) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border bg-card text-muted-foreground/45 shadow-sm">
          <GitCompare className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Chưa đủ phòng để so sánh</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Hãy chọn thêm ít nhất 2 phòng từ trang tìm kiếm để hiển thị bảng so sánh chi tiết các tiện ích và giá cả.
        </p>
        <Button onClick={() => navigate('/search')} className="mt-6 rounded-xl">
          Tìm phòng ngay
        </Button>
      </div>
    )
  }

  // Highlight helpers
  const minPrice = rooms.length ? Math.min(...rooms.map((r) => r.price || Infinity)) : 0
  const maxArea = rooms.length ? Math.max(...rooms.map((r) => r.area || 0)) : 0

  const colCount = rooms.length || compareList.length

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 pb-28">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary shadow-sm">
            <GitCompare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">So sánh phòng trọ</h1>
            <p className="text-xs text-muted-foreground">So sánh chi tiết các thông số của {compareList.length} phòng đang chọn</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {!userLocation ? (
            <Button variant="outline" size="sm" onClick={() => setLocationPickerOpen(true)} className="gap-1.5 rounded-xl text-xs h-9">
              <MapPin className="h-3.5 w-3.5" /> Xác định khoảng cách
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocationPickerOpen(true)}
              className="gap-1.5 rounded-xl text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-9"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Cập nhật vị trí so sánh
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { clearRooms(); navigate('/search') }} className="gap-1.5 rounded-xl text-xs h-9 text-muted-foreground">
            <Trash2 className="h-3.5 w-3.5" /> Xoá tất cả
          </Button>
        </div>
      </div>

      {/* Comparison Table wrapper */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[700px] border-collapse">
          <colgroup>
            <col className="w-40 bg-muted/5" />
            {Array.from({ length: colCount }).map((_, i) => (
              <col key={i} className="min-w-[200px]" />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b">
              <th className="bg-muted/10 px-5 py-4 border-r"></th>
              {loading
                ? Array.from({ length: compareList.length }).map((_, i) => (
                  <th key={i} className="px-5 py-4 border-r last:border-r-0"><Skeleton className="h-36 w-full rounded-xl" /></th>
                ))
                : rooms.map((room) => (
                  <th key={room._id} className="px-5 py-4 text-left border-r last:border-r-0 font-normal align-top">
                    <div className="space-y-3 relative group">
                      <div className="relative overflow-hidden rounded-xl border bg-muted aspect-[16/10]">
                        {room.images?.[0] ? (
                          <img src={room.images[0]} alt={room.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/50">
                            <Home className="h-6 w-6" />
                            <span className="text-[10px]">Chưa có ảnh</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeRoom(room._id)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-sm border text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                          title="Xoá khỏi danh sách"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <Link to={`/rooms/${room.slug}`} className="block font-semibold text-sm leading-snug hover:text-primary line-clamp-2 min-h-[40px]">
                        {room.title}
                      </Link>
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {/* Giá */}
            <Row label="Giá thuê">
              {loading
                ? Array.from({ length: compareList.length }).map((_, i) => <Cell key={i}><Skeleton className="h-6 w-28" /></Cell>)
                : rooms.map((room) => (
                  <Cell key={room._id} highlight={room.price === minPrice}>
                    <div className="flex flex-col gap-1">
                      <span className={cn('text-base font-bold', room.price === minPrice ? 'text-emerald-600' : 'text-primary')}>
                        {formatCurrency(room.price)}
                      </span>
                      {room.price === minPrice && (
                        <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          Giá tốt nhất
                        </Badge>
                      )}
                    </div>
                  </Cell>
                ))}
            </Row>

            {/* Diện tích */}
            <Row label="Diện tích">
              {loading
                ? Array.from({ length: compareList.length }).map((_, i) => <Cell key={i}><Skeleton className="h-5 w-20" /></Cell>)
                : rooms.map((room) => (
                  <Cell key={room._id} highlight={room.area === maxArea}>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {room.area} m²
                      </span>
                      {room.area === maxArea && (
                        <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold">
                          Rộng nhất
                        </Badge>
                      )}
                    </div>
                  </Cell>
                ))}
            </Row>

            {/* Khoảng cách */}
            {rooms.some((r) => r.distance_km !== undefined) && (
              <Row label="Khoảng cách">
                {rooms.map((room) => (
                  <Cell key={room._id}>
                    {room.distance_km !== undefined ? (
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Cách bạn {room.distance_km} km
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </Cell>
                ))}
              </Row>
            )}

            {/* Trạng thái */}
            <Row label="Trạng thái">
              {loading
                ? Array.from({ length: compareList.length }).map((_, i) => <Cell key={i}><Skeleton className="h-5 w-20" /></Cell>)
                : rooms.map((room) => (
                  <Cell key={room._id}>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-semibold py-0.5 px-2 rounded-full',
                        room.isAvailable
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      )}
                    >
                      {room.isAvailable ? 'Còn trống' : 'Hết phòng'}
                    </Badge>
                  </Cell>
                ))}
            </Row>

            {/* Tiện ích */}
            {ALL_AMENITIES.map((key) => {
              const config = amenityConfig[key]
              if (!rooms.length) return null
              // Chỉ hiện dòng tiện ích nếu ít nhất 1 phòng so sánh có tiện ích này
              if (!rooms.some((r) => (r.amenities || []).includes(key))) return null
              return (
                <Row key={key} label={config.label}>
                  {rooms.map((room) => {
                    const has = (room.amenities || []).includes(key)
                    return (
                      <Cell key={room._id}>
                        {has ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted/40 text-muted-foreground/30 border border-muted-200/50">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </Cell>
                    )
                  })}
                </Row>
              )
            })}

            {/* Actions */}
            <Row label="Thao tác">
              {loading
                ? Array.from({ length: compareList.length }).map((_, i) => <Cell key={i}><Skeleton className="h-9 w-full" /></Cell>)
                : rooms.map((room) => (
                  <Cell key={room._id}>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" asChild className="rounded-lg h-9 w-full font-medium">
                        <Link to={`/rooms/${room.slug}`} className="flex items-center justify-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" /> Chi tiết
                        </Link>
                      </Button>
                      <FavoriteButton roomId={room._id} size="sm" className="w-full justify-center rounded-lg h-9 text-xs" />
                    </div>
                  </Cell>
                ))}
            </Row>
          </tbody>
        </table>
      </div>

      <LocationPickerDialog
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(coords) => { setUserLocation(coords); toast.success('Đã cập nhật vị trí') }}
      />
    </div>
  )
}
