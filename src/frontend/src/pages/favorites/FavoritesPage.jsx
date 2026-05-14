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
      <section className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-red-50 text-red-600 dark:bg-red-950/40">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Phòng yêu thích</h1>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Lưu lại các phòng bạn quan tâm để so sánh và quay lại xem nhanh hơn.
                </p>
              </div>
            </div>

            {rooms.length > 0 && (
              <Button asChild variant="outline" className="h-9 rounded-lg">
                <Link to="/search">
                  <Search className="h-4 w-4" />
                  Tìm thêm
                </Link>
              </Button>
            )}
          </div>

          {!loading && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="h-8 rounded-lg px-3">
                {rooms.length > 0 ? `${rooms.length} phòng đã lưu` : 'Chưa có phòng nào'}
              </Badge>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <RoomCardSkeleton key={index} />)}
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-400 dark:bg-red-950/40">
                <HeartOff className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Chưa có phòng yêu thích</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                  Khi thấy phòng phù hợp, nhấn biểu tượng trái tim để lưu vào danh sách này.
                </p>
              </div>
              <Button asChild className="rounded-lg">
                <Link to="/search">
                  <Search className="h-4 w-4" />
                  Khám phá phòng ngay
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    title="Bỏ yêu thích"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50 dark:bg-zinc-900/95"
                  >
                    <Trash2 className="h-4 w-4" />
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
