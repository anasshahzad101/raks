"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useCallback } from "react"

import { SortOptions } from "../sort-products"

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Latest Arrivals" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
]

type SortDropdownProps = {
  sortBy: SortOptions
  "data-testid"?: string
}

const SortDropdown = ({ sortBy, "data-testid": dataTestId }: SortDropdownProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current =
    sortOptions.find((o) => o.value === sortBy) ?? sortOptions[0]

  const setSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set("sortBy", value)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <Listbox value={sortBy} onChange={setSort}>
      <div className="relative" data-testid={dataTestId}>
        <ListboxButton className="group flex items-center gap-x-2 border border-bronze-200 bg-[#fffdf9] px-4 py-2.5 text-[12.5px] tracking-[0.04em] text-ink transition-colors hover:border-accent">
          <span className="text-ink/50">Sort by:</span>
          <span className="font-medium">{current.label}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            className="text-ink/60 transition-transform group-data-[open]:rotate-180"
            aria-hidden
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ListboxButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <ListboxOptions className="absolute right-0 z-50 mt-2 min-w-[210px] overflow-hidden border border-bronze-200 bg-[#fffdf9] py-1 shadow-lg focus:outline-none">
            {sortOptions.map((o) => (
              <ListboxOption
                key={o.value}
                value={o.value}
                className="cursor-pointer px-4 py-2.5 text-sm text-ink/70 transition-colors data-[focus]:bg-cream-100 data-[selected]:font-medium data-[selected]:text-ink"
              >
                {o.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}

export default SortDropdown
