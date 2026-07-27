import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  const isSize = /size/i.test(title)

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-[0.16em] text-ink font-medium">
          Select {title}
        </span>
        {isSize && (
          <span className="text-[12px] text-gold border-b border-bronze-200 cursor-pointer">
            Size guide
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "min-w-[50px] border px-4 py-3 text-[13px] transition-colors duration-150",
                {
                  "border-accent bg-accent text-white": v === current,
                  "border-bronze-200 bg-[#fffdf9] text-ink hover:border-accent":
                    v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
