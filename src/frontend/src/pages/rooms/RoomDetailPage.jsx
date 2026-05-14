import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet'
import {
  ArrowLeft,
  ArrowUp,
  Bath,
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  Flame,
  Home,
  ImageIcon,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Send,
  Share2,
  ShieldCheck,
  Sofa,
  SquareArrowOutUpRight,
  Trees,
  TrendingUp,
  Users,
  WashingMachine,
  Wifi,
  Wind,
  X,
  XCircle,
  Zap,
  Maximize2,
} from 'lucide-react'
import { getRoomBySlugApi } from '@/services/roomService'
import { createInteractionApi } from '@/services/interactionService'
import { getFavoriteIdsApi } from '@/services/favoriteService'
import { createConversationApi } from '@/services/chatService'
import { getSocket } from '@/hooks/useSocket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingDialog } from '@/components/rooms/BookingDialog'
import { CommentSection } from '@/components/rooms/CommentSection'
import { FavoriteButton } from '@/components/rooms/FavoriteButton'
import { PanoramaViewer } from '@/components/rooms/PanoramaViewer'
import { ReportButton } from '@/components/rooms/ReportButton'
import { SimilarRooms } from '@/components/rooms/SimilarRooms'
import { CompareButton } from '@/components/compare/CompareBar'
import { LocationPickerDialog } from '@/components/common/LocationPickerDialog'
import { cn } from '@/lib/utils'

const ROOM_TYPE_LABELS = {
  'phòng_trọ': 'Phòng trọ',
  'chung_cư_mini': 'Chung cư mini',
  'nhà_nguyên_căn': 'Nhà nguyên căn',
  'ký_túc_xá': 'Ký túc xá',
}

const AMENITY_CONFIG = {
  wifi: { label: 'Wifi', icon: Wifi },
  'điều_hòa': { label: 'Điều hòa', icon: Wind },
  'nóng_lạnh': { label: 'Nóng lạnh', icon: Flame },
  'tủ_lạnh': { label: 'Tủ lạnh', icon: Package },
  'máy_giặt': { label: 'Máy giặt', icon: WashingMachine },
  bếp: { label: 'Bếp', icon: ChefHat },
  'chỗ_để_xe': { label: 'Chỗ để xe', icon: Car },
  an_ninh: { label: 'An ninh', icon: ShieldCheck },
  camera: { label: 'Camera', icon: Camera },
  'thang_máy': { label: 'Thang máy', icon: ArrowUp },
  'ban_công': { label: 'Ban công', icon: Trees },
  'nội_thất': { label: 'Nội thất', icon: Sofa },
  'vệ_sinh_riêng': { label: 'Vệ sinh riêng', icon: Bath },
  'điện_nước_riêng': { label: 'Điện nước riêng', icon: Zap },
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

function formatAddress(address) {
  if (!address) return ''
  if (typeof address === 'string') return address
  return address.fullAddress || [address.street, address.ward, address.district, address.city].filter(Boolean).join(', ')
}

function ImageLightbox({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex ?? 0)

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-black/95" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3" onClick={(event) => event.stopPropagation()}>
        <span className="text-sm font-medium text-white/70">{index + 1}/{images.length}</span>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-12" onClick={(event) => event.stopPropagation()}>
        <img src={images[index]} alt="" className="max-h-full max-w-full select-none object-contain" />
      </div>

      {images.length > 1 && (
        <>
          <button type="button" onClick={(event) => { event.stopPropagation(); setIndex((current) => (current - 1 + images.length) % images.length) }} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); setIndex((current) => (current + 1) % images.length) }} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 overflow-x-auto px-4 py-3" onClick={(event) => event.stopPropagation()}>
          {images.map((image, itemIndex) => (
            <button key={`${image}-${itemIndex}`} type="button" onClick={() => setIndex(itemIndex)} className={cn('shrink-0 overflow-hidden rounded-md transition-opacity', itemIndex === index ? 'opacity-100 ring-2 ring-white' : 'opacity-40 hover:opacity-70')}>
              <img src={image} alt="" className="h-12 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-[360px] w-full rounded-lg" />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  )
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-3">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
      </div>
    </div>
  )
}

function SectionCard({ title, action, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-4 pt-2">{children}</CardContent>
    </Card>
  )
}

export default function RoomDetailPage() {
  const { slug } = useParams()
  const user = useSelector((state) => state.auth?.user)
  const navigate = useNavigate()
  const socket = getSocket()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [panoramaSrc, setPanoramaSrc] = useState(null)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('info')
  const [userLocation, setUserLocation] = useState(null)
  const [distanceText, setDistanceText] = useState('')
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [routePositions, setRoutePositions] = useState([])
  const [routeSummary, setRouteSummary] = useState('')
  const [routing, setRouting] = useState(false)
  const [inquiryText, setInquiryText] = useState('')
  const [inquirySending, setInquirySending] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const afterPickRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setErrorMsg('')
    getRoomBySlugApi(slug)
      .then((res) => setRoom(res.data?.data?.room || null))
      .catch((error) => {
        const message = error?.response?.data?.message || ''
        if (error?.response?.status === 404) setErrorMsg(message || 'Không tìm thấy phòng')
        else toast.error('Không thể tải chi tiết phòng')
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    setImgIdx(0)
    setDescriptionExpanded(false)
  }, [room?.slug])

  useEffect(() => {
    if (!room?._id || !user) return
    createInteractionApi(room._id, 'view').catch(() => {})
    getFavoriteIdsApi()
      .then((res) => setIsFavorited((res.data?.data?.roomIds || []).includes(String(room._id))))
      .catch(() => {})
  }, [room?._id, user])

  const roomPosition = useMemo(() => {
    if (!room?.location?.coordinates) return null
    const [lng, lat] = room.location.coordinates
    return [lat, lng]
  }, [room])

  const images = room?.images || []
  const images360 = room?.images360 || []
  const videos = room?.videos || []
  const selectedImage = images[imgIdx] || images[0] || ''
  const userPos = userLocation ? [userLocation.lat, userLocation.lng] : null
  const description = room?.description || 'Chưa có mô tả.'
  const shouldCollapseDescription = description.length > 320 || description.split('\n').length > 6

  const openLocationPicker = (callback = null) => {
    afterPickRef.current = callback
    setLocationPickerOpen(true)
  }

  const handleLocationPicked = (coords) => {
    setUserLocation(coords)
    if (room?.location?.coordinates) {
      const [roomLng, roomLat] = room.location.coordinates
      const radius = 6371
      const dLat = ((roomLat - coords.lat) * Math.PI) / 180
      const dLng = ((roomLng - coords.lng) * Math.PI) / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((coords.lat * Math.PI) / 180) * Math.cos((roomLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      const km = radius * 2 * Math.asin(Math.sqrt(Math.min(1, a)))
      setDistanceText(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)
    }
    if (afterPickRef.current) {
      afterPickRef.current(coords)
      afterPickRef.current = null
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/rooms/${room.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: room.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Đã sao chép link')
    } catch {
      toast.error('Không thể sao chép link')
    }
  }

  const handleDirections = async () => {
    if (!roomPosition) return

    const route = async (loc) => {
      try {
        setRouting(true)
        setRouteSummary('')
        const { lat: originLat, lng: originLng } = loc
        const [destLat, destLng] = roomPosition
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`)
        const data = await response.json()
        const foundRoute = data?.routes?.[0]
        if (!foundRoute?.geometry?.coordinates?.length) throw new Error()
        const positions = foundRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        setRoutePositions(positions)
        const distance = foundRoute.distance ? `${(foundRoute.distance / 1000).toFixed(1)} km` : ''
        const duration = foundRoute.duration ? `khoảng ${Math.round(foundRoute.duration / 60)} phút` : ''
        setRouteSummary([distance, duration].filter(Boolean).join(' · '))
        mapRef.current?.fitBounds?.(positions, { padding: [30, 30] })
        setActiveTab('map')
        toast.success('Đã vẽ tuyến đường')
      } catch {
        setRoutePositions([[loc.lat, loc.lng], roomPosition])
        setRouteSummary('Đường thẳng ước lượng')
        toast.error('Không lấy được lộ trình')
      } finally {
        setRouting(false)
      }
    }

    if (userLocation) {
      route(userLocation)
      return
    }
    openLocationPicker((loc) => route(loc))
  }

  const goImage = (direction) => setImgIdx((current) => (current + direction + images.length) % images.length)
  const goMessage = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(`/messages?to=${room.landlord?._id}&room=${room._id}`)
  }
  const goBooking = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setBookingOpen(true)
  }

  const sendQuickMessage = async (event) => {
    event.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!inquiryText.trim() || !room?.landlord?._id) return
    try {
      setInquirySending(true)
      const res = await createConversationApi(room.landlord._id, room._id)
      const conversation = res.data?.data?.conversation
      if (!conversation) throw new Error()
      if (!socket.connected) socket.connect()
      socket.emit('join_conversation', conversation._id)
      socket.emit('send_message', {
        conversationId: conversation._id,
        senderId: user._id,
        content: inquiryText.trim(),
        attachments: [],
      })
      toast.success('Tin nhắn đã được gửi')
      setInquiryText('')
      navigate('/messages')
    } catch {
      toast.error('Gửi tin thất bại')
    } finally {
      setInquirySending(false)
    }
  }

  if (loading) return <PageSkeleton />

  if (errorMsg || !room) {
    const hidden = errorMsg?.includes('ẩn') || errorMsg?.includes('vi phạm') || errorMsg?.includes('công khai')
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {hidden ? <XCircle className="h-7 w-7" /> : <Home className="h-7 w-7" />}
        </div>
        <div>
          <p className="text-lg font-semibold">{errorMsg || 'Không tìm thấy phòng'}</p>
          {hidden && <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Phòng này đã bị ẩn hoặc xóa do không còn công khai.</p>}
        </div>
        <Button size="sm" asChild><Link to="/search">Tìm phòng khác</Link></Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/search" className="flex shrink-0 items-center gap-1 whitespace-nowrap hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <span className="sm:hidden">Tìm</span>
          </Link>
          <span className="shrink-0">/</span>
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{room.title}</span>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="relative">
            {selectedImage ? (
              <button type="button" className="block w-full text-left" onClick={() => setLightboxIdx(imgIdx)}>
                <img src={selectedImage} alt={room.title} className="h-[280px] w-full object-cover sm:h-[460px]" />
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-white/30 bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                  <Expand className="h-3.5 w-3.5" />
                  Xem ảnh lớn
                </span>
              </button>
            ) : images360.length > 0 ? (
              <button type="button" onClick={() => setPanoramaSrc(images360[0])} className="relative flex h-[280px] w-full items-center justify-center bg-muted sm:h-[460px]">
                <img src={images360[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <span className="relative rounded-full border bg-background/95 px-4 py-2 text-sm font-semibold">Xem ảnh 360</span>
              </button>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground sm:h-[460px]">
                <ImageIcon className="h-12 w-12" />
                <span className="text-sm">Chưa có ảnh</span>
              </div>
            )}

            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={cn('border shadow-sm', room.isAvailable ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-700')}>
                {room.isAvailable ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
                {room.isAvailable ? 'Còn trống' : 'Đã cho thuê'}
              </Badge>
              {images360.length > 0 && selectedImage && (
                <Button type="button" size="sm" variant="secondary" className="h-7 rounded-full px-3 text-xs shadow-sm" onClick={() => setPanoramaSrc(images360[0])}>
                  <Camera className="h-3.5 w-3.5" />
                  360
                </Button>
              )}
            </div>

            {images.length > 1 && (
              <>
                <Button type="button" size="icon" variant="secondary" className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full" onClick={() => goImage(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="secondary" className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full" onClick={() => goImage(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {(images.length > 1 || images360.length > 0) && (
            <div className="flex gap-2 overflow-x-auto border-t bg-background p-3">
              {images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" onClick={() => setImgIdx(index)} className={cn('shrink-0 overflow-hidden rounded-lg border', index === imgIdx ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100')}>
                  <img src={image} alt="" className="h-16 w-24 object-cover" />
                </button>
              ))}
              {images360.map((image, index) => (
                <button key={`360-${image}-${index}`} type="button" onClick={() => setPanoramaSrc(image)} className="relative shrink-0 overflow-hidden rounded-lg border border-primary/50">
                  <img src={image} alt="" className="h-16 w-24 object-cover opacity-70" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-xs font-bold text-white">360</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {videos.length > 0 && (
          <SectionCard title="Video phòng trọ" action={<Badge variant="secondary">{videos.length} video</Badge>}>
            <div className={cn('grid gap-3', videos.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1')}>
              {videos.map((url, index) => (
                <video key={`${url}-${index}`} src={url} controls preload="metadata" className="max-h-[320px] w-full rounded-lg border bg-black object-contain" />
              ))}
            </div>
          </SectionCard>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <main className="min-w-0 space-y-5">
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{ROOM_TYPE_LABELS[room.roomType] || 'Phòng trọ'}</Badge>
                {distanceText ? (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => openLocationPicker()}>
                    <MapPin className="mr-1 h-3.5 w-3.5" />
                    Cách bạn {distanceText}
                  </Badge>
                ) : (
                  <button type="button" onClick={() => openLocationPicker()} className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5">
                    <MapPin className="h-3.5 w-3.5" />
                    Chọn vị trí
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{room.title}</h1>
                {formatAddress(room.address) && (
                  <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-muted-foreground">
                    <MapPin className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                    {formatAddress(room.address)}
                  </p>
                )}
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatItem icon={Maximize2} label="Diện tích" value={`${room.area || 0} m²`} />
              <StatItem icon={Users} label="Sức chứa" value={`${room.capacity || 1} người`} />
              <StatItem icon={TrendingUp} label="Lượt xem" value={(room.viewCount || 0).toLocaleString('vi-VN')} />
              <StatItem icon={Clock} label="Ngày đăng" value={room.createdAt ? new Date(room.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'} />
            </div>

            {!userLocation && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <p className="flex-1 text-sm leading-6 text-muted-foreground">Chọn vị trí của bạn để xem khoảng cách và chỉ đường đến phòng.</p>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => openLocationPicker()}>Chọn vị trí</Button>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info"><Home className="mr-1.5 h-3.5 w-3.5" />Thông tin</TabsTrigger>
                <TabsTrigger value="map"><MapPin className="mr-1.5 h-3.5 w-3.5" />Bản đồ</TabsTrigger>
                <TabsTrigger value="reviews"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Bình luận</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <SectionCard title="Mô tả">
                  <div className="space-y-3">
                    <div className={cn('relative overflow-hidden', shouldCollapseDescription && !descriptionExpanded && 'max-h-44')}>
                      <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{description}</p>
                      {shouldCollapseDescription && !descriptionExpanded && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card to-transparent" />
                      )}
                    </div>
                    {shouldCollapseDescription && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg"
                        onClick={() => setDescriptionExpanded((value) => !value)}
                      >
                        {descriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
                      </Button>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Địa chỉ"
                  action={formatAddress(room.address) && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(room.address))}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                      Google Maps
                    </a>
                  )}
                >
                  <p className="text-sm leading-6 text-muted-foreground">{formatAddress(room.address) || 'Chưa có địa chỉ.'}</p>
                </SectionCard>

                {(room.amenities || []).length > 0 && (
                  <SectionCard title="Tiện ích">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(room.amenities || []).map((amenity) => {
                        const config = AMENITY_CONFIG[amenity]
                        const Icon = config?.icon
                        return (
                          <div key={amenity} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
                            <span className="truncate font-medium">{config?.label || amenity.replace(/_/g, ' ')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </SectionCard>
                )}
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <Card className="overflow-hidden">
                  <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{userPos ? 'Vị trí của bạn và phòng trọ' : 'Bản đồ phòng trọ'}</p>
                      {!userPos && <p className="text-xs text-muted-foreground">Chọn vị trí để xem khoảng cách và chỉ đường.</p>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Phòng</span>
                      {userPos && <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Bạn</span>}
                    </div>
                  </div>

                  {roomPosition ? (
                    <MapContainer center={roomPosition} zoom={15} className="h-[420px] w-full" ref={mapRef}>
                      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <CircleMarker center={roomPosition} radius={10} pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 }}>
                        <Popup><strong>{room.title}</strong><br />{formatPrice(room.price)}</Popup>
                      </CircleMarker>
                      {userPos && (
                        <>
                          <CircleMarker center={userPos} radius={9} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }}>
                            <Popup>Vị trí của bạn</Popup>
                          </CircleMarker>
                          {routePositions.length > 1 && <Polyline positions={routePositions} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.75, dashArray: '8 4' }} />}
                        </>
                      )}
                    </MapContainer>
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-8 w-8 opacity-40" />
                      Phòng chưa có tọa độ
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 border-t px-4 py-3">
                    {!userPos && <Button variant="outline" size="sm" className="rounded-lg" onClick={() => openLocationPicker()}><MapPin className="h-4 w-4" />Chọn vị trí</Button>}
                    {roomPosition && <Button variant="outline" size="sm" className="rounded-lg" onClick={handleDirections} disabled={routing}><Navigation className="h-4 w-4" />{routing ? 'Đang tìm...' : 'Chỉ đường'}</Button>}
                    {routeSummary && <span className="flex items-center text-sm font-medium text-muted-foreground">Lộ trình: {routeSummary}</span>}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <CommentSection roomId={room?._id} landlordId={room?.landlord?._id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Giá thuê</p>
                  <p className="mt-1 text-2xl font-extrabold text-primary">{formatPrice(room.price)}<span className="text-sm font-medium text-muted-foreground">/tháng</span></p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Button className="rounded-lg" onClick={goBooking}>
                    <Calendar className="h-4 w-4" />
                    Đặt lịch xem phòng
                  </Button>
                  <Button variant="outline" className="rounded-lg" onClick={goMessage}>
                    <MessageCircle className="h-4 w-4" />
                    Nhắn tin chủ trọ
                  </Button>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <FavoriteButton roomId={room._id} initialFavorited={isFavorited} size="icon" />
                    <span className="text-xs font-medium">{isFavorited ? 'Đã lưu' : 'Yêu thích'}</span>
                  </div>
                  <button type="button" onClick={handleShare} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    Chia sẻ
                  </button>
                  <button type="button" onClick={handleDirections} disabled={routing} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    {routing ? 'Đang tìm' : 'Chỉ đường'}
                  </button>
                  <CompareButton room={room} />
                </div>
                <ReportButton roomId={room._id} />
              </CardContent>
            </Card>

            {room.landlord && (
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center gap-3">
                    <Link to={`/landlord/${room.landlord.username || room.landlord._id}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-bold">
                      {(room.landlord.name || 'C')[0].toUpperCase()}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Chủ trọ</p>
                      <Link to={`/landlord/${room.landlord.username || room.landlord._id}`} className="block truncate font-semibold hover:text-primary">{room.landlord.name || 'Không rõ'}</Link>
                      {room.landlord.phone && <p className="text-xs text-muted-foreground">{room.landlord.phone}</p>}
                    </div>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={goMessage}>
                      Chat
                    </Button>
                  </div>
                  {(room.landlord.responseRate != null || room.landlord.avgResponseTime != null) && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                      {room.landlord.responseRate != null && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" />Tỷ lệ trả lời</span>
                          <span className="font-bold text-emerald-600">{room.landlord.responseRate}%</span>
                        </div>
                      )}
                      {room.landlord.avgResponseTime != null && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Thời gian TB: <strong className="text-foreground">{room.landlord.avgResponseTime < 60 ? `${room.landlord.avgResponseTime} phút` : room.landlord.avgResponseTime < 1440 ? `${Math.round(room.landlord.avgResponseTime / 60)} giờ` : `${Math.round(room.landlord.avgResponseTime / 1440)} ngày`}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                  <Link to={`/landlord/${room.landlord.username || room.landlord._id}`} className="flex w-full items-center justify-center rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                    Xem tất cả phòng của chủ trọ
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Nhắn nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {['Phòng còn trống không?', 'Có video không?', 'Giờ giấc tự do không?', 'Điện nước tính sao?'].map((chip) => (
                    <button key={chip} type="button" onClick={() => { if (!user) { navigate('/login'); return }; setInquiryText(chip) }} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-medium hover:border-primary hover:text-primary">
                      {chip}
                    </button>
                  ))}
                </div>
                <form className="flex gap-2" onSubmit={sendQuickMessage}>
                  <input value={inquiryText} onChange={(event) => setInquiryText(event.target.value)} onFocus={() => { if (!user) navigate('/login') }} placeholder={user ? 'Nhập tin nhắn...' : 'Đăng nhập để nhắn tin'} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button type="submit" size="sm" className="rounded-lg" disabled={!inquiryText.trim() || inquirySending}>
                    <Send className="h-3.5 w-3.5" />
                    {inquirySending ? '...' : 'Gửi'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {routeSummary && (
              <Card>
                <CardContent className="flex items-center gap-2 p-3">
                  <Navigation className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{routeSummary}</span>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>

      {room?._id && (
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <SimilarRooms roomId={room._id} limit={6} targetLocation={room.location?.coordinates} />
        </div>
      )}

      <BookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)} roomId={room?._id} roomTitle={room?.title} />
      <LocationPickerDialog open={locationPickerOpen} onClose={() => setLocationPickerOpen(false)} onSelect={handleLocationPicked} />
      {panoramaSrc && <PanoramaViewer src={panoramaSrc} onClose={() => setPanoramaSrc(null)} />}
      {lightboxIdx !== null && images.length > 0 && <ImageLightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </div>
  )
}
