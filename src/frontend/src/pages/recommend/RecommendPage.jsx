import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  CircleSlash,
  LogIn,
  MapPin,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoomCard, RoomCardSkeleton } from '@/components/rooms/RoomCard'
import { LocationPickerDialog } from '@/components/common/LocationPickerDialog'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { forYouApi, wizardRecommendApi } from '@/services/recommendService'
import { cn } from '@/lib/utils'

function haversineKm(lat1, lng1, lat2, lng2) {
  const radius = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return radius * 2 * Math.asin(Math.sqrt(a))
}

function getRoomDistanceText(room, userLat, userLng) {
  if (!userLat || !userLng) return null
  const coords = room?.location?.coordinates
  if (!coords || coords.length < 2) return null
  const [lng, lat] = coords
  const km = haversineKm(userLat, userLng, lat, lng)
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km * 10) / 10} km`
}

export default function RecommendPage() {
  const isAuth = useSelector(selectIsAuthenticated)
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState([])
  const [displayGps, setDisplayGps] = useState(null)
  const [apiGps, setApiGps] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const fetchForYou = useCallback(async (location = null) => {
    setLoading(true)
    try {
      const res = await forYouApi({ limit: 12, ...(location ?? {}) })
      setRooms(res.data?.data?.rooms || [])
    } catch {
      toast.error('Không tải được gợi ý')
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTopForGuest = useCallback(async (location = null) => {
    setLoading(true)
    try {
      const res = await wizardRecommendApi({ limit: 12, ...(location ?? {}) })
      setRooms(res.data?.data?.rooms || [])
    } catch {
      toast.error('Không tải được gợi ý')
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [])

  const doFetch = useCallback((location = null) => {
    if (isAuth) fetchForYou(location)
    else fetchTopForGuest(location)
  }, [isAuth, fetchForYou, fetchTopForGuest])

  useEffect(() => {
    doFetch(null)
  }, [doFetch])

  const handleLocationSelect = (coords) => {
    setApiGps(coords)
    setDisplayGps(coords)
    doFetch(coords)
    toast.success('Đã cập nhật vị trí')
  }

  const clearGPS = () => {
    setApiGps(null)
    doFetch(null)
  }

  const sourceLabel = apiGps
    ? 'Ưu tiên phòng gần bạn'
    : isAuth ? 'Gợi ý dành riêng cho bạn' : 'Phòng nổi bật hôm nay'

  return (
    <div className="min-h-screen bg-muted/20">
      <section className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-card text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Gợi ý cho bạn</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {isAuth
                    ? 'Danh sách được cá nhân hóa theo phòng bạn đã xem, đã lưu và mức độ phù hợp với nhu cầu.'
                    : 'Các phòng được quan tâm nhiều. Đăng nhập để nhận gợi ý sát sở thích hơn.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isAuth && (
                <Button asChild variant="outline" className="h-9 rounded-lg">
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    Đăng nhập
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="h-9 rounded-lg" onClick={() => doFetch(apiGps)} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {!isAuth && (
          <Card className="border-primary/20">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <p className="flex-1 text-sm leading-6 text-muted-foreground">
                Đăng nhập để hệ thống học theo lịch sử xem phòng, yêu thích và tương tác của bạn.
              </p>
              <Button asChild size="sm" className="rounded-lg">
                <Link to="/login">Đăng nhập ngay</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Vị trí gợi ý</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {apiGps ? 'Đang ưu tiên các phòng gần vị trí bạn chọn.' : 'Chọn vị trí để ưu tiên phòng ở gần bạn hơn.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {apiGps && (
                <Badge variant="outline" className="h-9 rounded-lg border-sky-200 bg-sky-50 px-3 text-sky-700">
                  <MapPin className="mr-1 h-3.5 w-3.5" />
                  Đang dùng vị trí
                </Badge>
              )}
              {apiGps && (
                <Button variant="ghost" size="sm" className="h-9 rounded-lg text-muted-foreground hover:text-destructive" onClick={clearGPS}>
                  <X className="h-4 w-4" />
                  Xóa vị trí
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => setPickerOpen(true)}>
                <MapPin className="h-4 w-4" />
                {apiGps ? 'Đổi vị trí' : 'Chọn vị trí'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">{sourceLabel}</h2>
            <p className="text-sm text-muted-foreground">Các phòng có khả năng phù hợp nhất được đặt lên trước.</p>
          </div>
          {!loading && rooms.length > 0 && <Badge variant="outline">{rooms.length} phòng</Badge>}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <RoomCardSkeleton key={index} />)}
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {apiGps ? <MapPin className="h-6 w-6" /> : <CircleSlash className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-semibold">{apiGps ? 'Chưa có phòng gần vị trí này' : 'Chưa có gợi ý phù hợp'}</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                  {apiGps
                    ? 'Thử đổi vị trí hoặc xóa vị trí để xem gợi ý tổng quát hơn.'
                    : 'Hãy xem thêm vài phòng để hệ thống hiểu sở thích của bạn tốt hơn.'}
                </p>
              </div>
              {apiGps && (
                <Button variant="outline" className="rounded-lg" onClick={clearGPS}>
                  <RotateCcw className="h-4 w-4" />
                  Xóa vị trí
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                distanceText={getRoomDistanceText(room, displayGps?.lat, displayGps?.lng)}
              />
            ))}
          </div>
        )}
      </main>

      <LocationPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleLocationSelect} />
    </div>
  )
}
