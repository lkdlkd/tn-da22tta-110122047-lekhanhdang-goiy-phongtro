import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { loginApi, getMeApi } from '@/services/authService'
import { loginStart, loginSuccess, loginFailure } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent, CardFooter } from '@/components/ui/card'
import { AlertCircle, Building2, GraduationCap, Loader2, Mail, MapPinned, Search, Sparkles, X } from 'lucide-react'
import {
  AuthCard,
  AuthShell,
  FormField,
  PasswordField,
  SubmitButton,
} from '@/pages/auth/components/AuthLayout'
import { cn } from '@/lib/utils'

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}`
}

const BACKEND_URL = `${getApiBaseUrl()}/api`

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
})

const GOOGLE_PATHS = [
  ['#4285F4', 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'],
  ['#34A853', 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'],
  ['#FBBC05', 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'],
  ['#EA4335', 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'],
]

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {GOOGLE_PATHS.map(([fill, d]) => <path key={fill} fill={fill} d={d} />)}
    </svg>
  )
}

function RolePickerModal({ onSelect, onClose }) {
  const roles = [
    {
      key: 'student',
      icon: GraduationCap,
      title: 'Sinh viên',
      desc: 'Lưu phòng yêu thích, nhận gợi ý và đặt lịch xem phòng.',
      className: 'border-blue-200 bg-blue-50/70 text-blue-700 hover:border-blue-400 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
    },
    {
      key: 'landlord',
      icon: Building2,
      title: 'Chủ trọ',
      desc: 'Đăng tin, quản lý phòng và trao đổi với người thuê.',
      className: 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:border-emerald-400 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card">
            <GoogleIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Tiếp tục với Google</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Chọn vai trò để hệ thống mở đúng trải nghiệm cho bạn.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map(({ key, icon: Icon, title, desc, className }) => (
            <button
              key={key}
              id={`google-role-${key}`}
              onClick={() => onSelect(key)}
              className={cn('flex min-h-36 flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all hover:shadow-sm', className)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold leading-tight">{title}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Đăng nhập Google thất bại, vui lòng thử lại')
      return
    }

    if (!token) return

    const handleGoogleToken = async () => {
      setGoogleLoading(true)
      try {
        localStorage.setItem('token', token)
        const res = await getMeApi()
        const user = res.data?.data?.user
        if (!user) throw new Error()
        dispatch(loginSuccess({ token, user }))
        toast.success(`Chào mừng ${user.name}!`)
        navigate('/', { replace: true })
      } catch {
        localStorage.removeItem('token')
        toast.error('Đăng nhập Google thất bại')
      } finally {
        setGoogleLoading(false)
      }
    }

    handleGoogleToken()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    dispatch(loginStart())
    setApiError('')
    try {
      const res = await loginApi(data)
      dispatch(loginSuccess(res.data.data))
      toast.success('Đăng nhập thành công! Chào mừng bạn trở lại')
      navigate('/')
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại'
      dispatch(loginFailure(message))
      setApiError(message)
      toast.error(message)
    }
  }

  const handleRoleSelect = (role) => {
    setShowRolePicker(false)
    window.location.href = `${BACKEND_URL}/auth/google?role=${role}`
  }

  if (googleLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Đang đăng nhập với Google...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showRolePicker && <RolePickerModal onSelect={handleRoleSelect} onClose={() => setShowRolePicker(false)} />}

      <AuthShell
        title="Chào mừng bạn trở lại"
        description="Đăng nhập để lưu phòng, đặt lịch xem và nhận gợi ý phù hợp hơn."
        asideTitle="Đăng nhập để tiếp tục hành trình tìm phòng phù hợp."
        asideDescription="Một tài khoản giúp bạn quản lý phòng yêu thích, lịch hẹn, tin nhắn và các đề xuất cá nhân hóa."
        asideItems={[
          { icon: Search, title: 'Tìm nhanh', desc: 'Lọc theo giá, vị trí và tiện ích.' },
          { icon: Sparkles, title: 'Gợi ý AI', desc: 'Ưu tiên phòng hợp nhu cầu.' },
          { icon: MapPinned, title: 'Theo khu vực', desc: 'Tập trung vào các điểm gần bạn.' },
        ]}
        footerPrompt="Chưa có tài khoản?"
        footerLinkText="Đăng ký"
        footerLinkTo="/register"
      >
        <AuthCard
          icon={Mail}
          title="Đăng nhập"
          description="Nhập thông tin tài khoản Phòng Trọ TVU của bạn."
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              <Button
                id="btn-google-login"
                type="button"
                variant="outline"
                className="h-11 w-full rounded-lg"
                onClick={() => setShowRolePicker(true)}
              >
                <GoogleIcon className="h-4 w-4" />
                Đăng nhập với Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Hoặc dùng email</span>
                </div>
              </div>

              {apiError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div className="flex-1 font-semibold leading-relaxed">{apiError}</div>
                </div>
              )}

              <FormField id="login-email" label="Email" error={errors.email?.message}>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  className={cn(
                    'h-11 rounded-lg transition-all duration-300',
                    errors.email ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'
                  )}
                  {...register('email')}
                />
              </FormField>

              <PasswordField
                id="login-password"
                label="Mật khẩu"
                autoComplete="current-password"
                register={register('password')}
                error={errors.password?.message}
                show={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <SubmitButton id="btn-login-submit" loading={isSubmitting} loadingText="Đang đăng nhập...">
                Đăng nhập
              </SubmitButton>
              <p className="text-center text-sm text-muted-foreground">
                Bạn là chủ trọ?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Tạo tài khoản để đăng phòng
                </Link>
              </p>
            </CardFooter>
          </form>
        </AuthCard>
      </AuthShell>
    </>
  )
}
