import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { forgotPasswordApi } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Mail, ShieldCheck, TimerReset } from 'lucide-react'
import {
  AuthCard,
  AuthShell,
  AuthStatusCard,
  FormField,
  SubmitButton,
} from '@/pages/auth/components/AuthLayout'

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
})

export default function ForgotPasswordPage() {
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await forgotPasswordApi(data.email)
      setSentEmail(data.email)
      toast.success('Email đặt lại mật khẩu đã được gửi')
    } catch (err) {
      const message = err.response?.data?.message || 'Gửi email thất bại'
      toast.error(message)
    }
  }

  return (
    <AuthShell
      title="Khôi phục mật khẩu"
      description="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu."
      asideTitle="Lấy lại quyền truy cập tài khoản một cách an toàn."
      asideDescription="Chúng tôi chỉ gửi liên kết khôi phục tới email đã đăng ký. Sau khi đổi mật khẩu, bạn có thể tiếp tục quản lý phòng, lịch hẹn và tin nhắn."
      asideItems={[
        { icon: Mail, title: 'Gửi qua email', desc: 'Liên kết khôi phục được gửi đến hộp thư của bạn.' },
        { icon: TimerReset, title: 'Có thời hạn', desc: 'Sử dụng liên kết sớm để đảm bảo bảo mật.' },
        { icon: ShieldCheck, title: 'Bảo vệ tài khoản', desc: 'Đặt mật khẩu mới trước khi đăng nhập lại.' },
      ]}
      footerPrompt="Nhớ mật khẩu?"
      footerLinkText="Đăng nhập"
      footerLinkTo="/login"
    >
      {sentEmail ? (
        <AuthStatusCard
          icon={Mail}
          tone="success"
          title="Kiểm tra email của bạn"
          description="Liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra cả hộp thư Spam hoặc Junk nếu chưa thấy email."
        >
          <div className="rounded-lg border bg-muted/40 p-4 text-left">
            <p className="text-xs font-medium uppercase text-muted-foreground">Email nhận liên kết</p>
            <p className="mt-1 break-all text-sm font-semibold text-foreground">{sentEmail}</p>
          </div>
          <Button variant="outline" asChild className="h-11 w-full rounded-lg">
            <Link to="/login">
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </Button>
        </AuthStatusCard>
      ) : (
        <AuthCard
          icon={Mail}
          title="Quên mật khẩu"
          description="Nhập email tài khoản. Hệ thống sẽ gửi liên kết để bạn tạo mật khẩu mới."
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              <FormField id="forgot-email" label="Email" error={errors.email?.message}>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  className="h-11 rounded-lg"
                  {...register('email')}
                />
              </FormField>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <SubmitButton id="btn-forgot-submit" loading={isSubmitting} loadingText="Đang gửi...">
                Gửi email đặt lại mật khẩu
              </SubmitButton>
              <Button variant="ghost" asChild className="h-11 w-full rounded-lg">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </Button>
            </CardFooter>
          </form>
        </AuthCard>
      )}
    </AuthShell>
  )
}
