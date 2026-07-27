import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold">
        Account
      </div>
      <h1 className="mb-3 font-display text-[36px] font-medium leading-none text-ink">
        Welcome back
      </h1>
      <p className="mb-8 text-center text-[14px] font-light text-ink/60">
        Sign in for faster checkout and to track your orders.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-6 text-center text-[14px] text-ink/70 bg-cream-100 border border-cream-300 p-4"
          data-testid="login-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please verify your email, then sign in.
        </div>
      )}
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Sign in
        </SubmitButton>
      </form>
      <span className="mt-6 text-center text-[13px] text-ink/60">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-medium text-accent underline underline-offset-2 hover:text-burgundy-dark"
          data-testid="register-button"
        >
          Join us
        </button>
      </span>
    </div>
  )
}

export default Login
