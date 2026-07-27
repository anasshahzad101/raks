import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-cream-300 py-12 gap-8">
          <div>
            <h3 className="mb-3 font-display text-[24px] font-medium text-ink">
              Got questions?
            </h3>
            <span className="text-[14px] font-light text-ink/60">
              Find frequently asked questions and answers on our FAQs page, or
              reach out and our team will help.
            </span>
          </div>
          <div>
            <UnderlineLink href="/faqs/">Visit FAQs</UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
