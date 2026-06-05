import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RoomCard } from '@/components/rooms/RoomCard'

function calcDistance(userLoc, roomCoords) {
  if (!userLoc || !roomCoords || roomCoords.length < 2) return undefined
  const [lng2, lat2] = roomCoords
  const { lat: lat1, lng: lng1 } = userLoc
  const radius = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const km = radius * 2 * Math.asin(Math.sqrt(Math.min(1, a)))
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function WizardResultsSheet({ open, rooms, onClose, onRetry, userLocation }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl p-6">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="text-base font-bold tracking-tight text-foreground">
            Gợi ý phòng phù hợp
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Tìm được <span className="font-semibold text-primary">{rooms.length}</span> phòng trọ phù hợp nhất với tiêu chí của bạn.
          </p>
        </DialogHeader>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">Không tìm thấy phòng phù hợp</p>
            <p className="text-xs max-w-xs leading-relaxed text-muted-foreground">
              Không tìm thấy phòng trọ nào phù hợp với tiêu chí hiện tại của bạn.
            </p>
            <Button variant="outline" onClick={onRetry} className="rounded-xl h-9 text-xs px-4 mt-2 font-semibold">
              Thử lại với tiêu chí khác
            </Button>
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  view="grid"
                  distanceText={calcDistance(userLocation, room.location?.coordinates)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4 mt-2">
          <Button variant="ghost" className="rounded-xl text-xs h-9 px-4 font-semibold" onClick={onClose}>
            Đóng
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl text-xs h-9 px-4 font-semibold" onClick={onRetry}>
              Sửa tiêu chí
            </Button>
            <Button className="rounded-xl text-xs h-9 px-4 font-semibold" asChild>
              <Link to="/search" onClick={onClose}>
                Xem tất cả
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
