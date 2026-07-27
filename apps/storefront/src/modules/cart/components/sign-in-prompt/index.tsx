import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between gap-4 border border-cream-300 bg-[#fffdf9] px-6 py-5">
      <div>
        <h2 className="font-display text-[20px] font-medium leading-tight text-ink">
          Already have an account?
        </h2>
        <p className="mt-1 text-[13px] text-ink/55">
          Sign in for faster checkout and to track your orders.
        </p>
      </div>
      <LocalizedClientLink
        href="/account"
        data-testid="sign-in-button"
        className="shrink-0 border border-accent px-6 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent hover:text-cream-50"
      >
        Sign in
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
