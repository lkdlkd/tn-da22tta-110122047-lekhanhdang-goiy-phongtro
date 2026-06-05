import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, HeartOff, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RoomCard, RoomCardSkeleton } from '@/components/rooms/RoomCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getFavoritesApi, removeFavoriteApi } from '@/services/favoriteService'

export default function FavoritesPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    getFavoritesApi()
      .then((res) => setRooms(res.data?.data?.rooms || []))
      .catch(() => toast.error('Không thể tải danh sách yêu thích'))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (roomId) => {
    setRemoving(roomId)
    try {
      await removeFavoriteApi(roomId)
      setRooms((prev) => prev.filter((room) => room._id !== roomId))
      toast.success('Đã bỏ khỏi yêu thích')
    } catch {
      toast.error('Có lỗi xảy ra, thử lại sau')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header section */}
      <section className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-red-500 shadow-sm">
                <Heart className="h-5 w-5 fill-current" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Phòng yêu thích</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lưu lại các phòng bạn quan tâm để dễ dàng theo dõi và so sánh nhanh.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!loading && (
                <Badge variant="outline" className="h-9 rounded-xl px-3.5 text-xs font-semibold bg-muted/30">
                  {rooms.length > 0 ? `${rooms.length} phòng đã lưu` : 'Trống'}
                </Badge>
              )}
              {rooms.length > 0 && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-9">
                  <Link to="/search">
                    <Search className="h-3.5 w-3.5" /> Tìm thêm phòng trọ
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid section */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <RoomCardSkeleton key={index} />)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="max-w-md mx-auto my-8">
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40 text-red-400">
                  <HeartOff className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-bold tracking-tight">Chưa lưu phòng trọ yêu thích</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hãy duyệt qua các tin phòng trọ quanh trường và nhấn nút trái tim để lưu lại các tin đăng bạn thấy ưng ý nhất.
                  </p>
                </div>
                <Button asChild className="rounded-xl h-9 text-xs gap-1.5 px-5 mt-2">
                  <Link to="/search">
                    <Search className="h-3.5 w-3.5" /> Khám phá phòng ngay
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                showFavorite={false}
                actionSlot={(
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      handleRemove(room._id)
                    }}
                    disabled={removing === room._id}
                    title="Xoá khỏi yêu thích"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-red-100 bg-background/90 backdrop-blur-sm text-red-500 shadow-sm transition-all hover:scale-110 active:scale-95 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-red-950/30 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
