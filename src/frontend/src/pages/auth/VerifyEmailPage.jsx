import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailApi } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle2, Loader2, MailCheck, ShieldCheck, TimerReset, XCircle } from 'lucide-react'
import { AuthShell, AuthStatusCard } from '@/pages/auth/components/AuthLayout'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Liên kết xác thực không hợp lệ.')
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    const verify = async () => {
      try {
        const res = await verifyEmailApi(token)
        setMessage(res.data.message || 'Xác thực email thành công!')
        setStatus('success')
      } catch (err) {
        setMessage(err.response?.data?.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.')
        setStatus('error')
      }
    }

    verify()
  }, [token])

  return (
    <AuthShell
      title="Xác thực email"
      description="Hoàn tất xác thực để kích hoạt tài khoản chủ trọ."
      asideTitle="Xác thực email giúp bảo vệ người thuê và chủ trọ."
      asideDescription="Tài khoản chủ trọ cần email hợp lệ trước khi đăng tin, quản lý lịch hẹn và trao đổi với người thuê trên hệ thống."
      asideItems={[
        { icon: MailCheck, title: 'Email hợp lệ', desc: 'Xác nhận đúng người sở hữu tài khoản.' },
        { icon: Building2, title: 'Sẵn sàng đăng tin', desc: 'Kích hoạt quyền quản lý phòng cho thuê.' },
        { icon: ShieldCheck, title: 'Tăng tin cậy', desc: 'Giúp người thuê yên tâm hơn khi liên hệ.' },
      ]}
      footerPrompt="Muốn quay lại?"
      footerLinkText="Trang chủ"
      footerLinkTo="/"
    >
      {status === 'loading' && (
        <AuthStatusCard
          icon={Loader2}
          tone="primary"
          title="Đang xác thực email..."
          description="Vui lòng chờ trong giây lát, hệ thống đang kiểm tra liên kết xác thực của bạn."
        />
      )}

      {status === 'success' && (
        <AuthStatusCard
          icon={CheckCircle2}
          tone="success"
          title="Xác thực thành công"
          description={message}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Tài khoản chủ trọ của bạn đã được kích hoạt. Bạn có thể đăng nhập để bắt đầu đăng tin phòng trọ.
          </p>
          <Button asChild className="h-11 w-full rounded-xl" id="btn-verify-login">
            <Link to="/login">Đăng nhập ngay</Link>
          </Button>
        </AuthStatusCard>
      )}

      {status === 'error' && (
        <AuthStatusCard
          icon={XCircle}
          tone="error"
          title="Xác thực thất bại"
          description={message}
        >
          <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            <TimerReset className="mx-auto mb-2 h-5 w-5 text-primary" />
            Liên kết xác thực thường chỉ có hiệu lực trong 24 giờ. Vui lòng đăng ký lại nếu liên kết đã hết hạn.
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="h-11 w-full rounded-xl">
              <Link to="/register">Đăng ký lại</Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 w-full rounded-xl">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </AuthStatusCard>
      )}
    </AuthShell>
  )
}
