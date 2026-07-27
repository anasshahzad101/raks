"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold">
        Join RAKS
      </div>
      <h1 className="mb-3 font-display text-[34px] font-medium leading-none text-ink">
        Create your account
      </h1>
      <p className="mb-6 text-center text-[14px] font-light text-ink/60">
        Save your details for faster checkout, track orders and shop your
        favourites.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-4 text-center text-[14px] text-ink/70 bg-cream-100 border border-cream-300 p-4"
          data-testid="register-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please check your inbox to verify your email, then sign in.
        </div>
      )}
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />
        <span className="mt-6 text-center text-[12.5px] leading-relaxed text-ink/55">
          By creating an account, you agree to RAKS&apos;s{" "}
          <LocalizedClientLink
            href="/privacy-policy/"
            className="text-accent underline underline-offset-2"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/terms-condition/"
            className="text-accent underline underline-offset-2"
          >
            Terms &amp; Conditions
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <span className="mt-6 text-center text-[13px] text-ink/60">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-medium text-accent underline underline-offset-2 hover:text-burgundy-dark"
        >
          Sign in
        </button>
      </span>
    </div>
  )
}

export default Register
