import { Label, RadioGroup, Text, clx } from "@modules/common/components/ui"
type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: string
  handleChange: (value: string) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Text className="text-xs uppercase tracking-luxe text-ink/60">
        {title}
      </Text>
      <RadioGroup data-testid={dataTestId} className="flex flex-col gap-y-2.5">
        {items?.map((i) => (
          <div key={i.value} className="flex items-center gap-x-2.5">
            <RadioGroup.Item
              checked={i.value === value}
              onChange={() => handleChange(i.value)}
              className="hidden peer"
              id={i.value}
              value={i.value}
            />
            <span
              className={clx(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                {
                  "border-ink": i.value === value,
                  "border-bronze-200": i.value !== value,
                }
              )}
              aria-hidden
            >
              {i.value === value && (
                <span className="h-2 w-2 rounded-full bg-ink" />
              )}
            </span>
            <Label
              htmlFor={i.value}
              className={clx(
                "!transform-none cursor-pointer text-sm transition-colors hover:text-ink",
                {
                  "font-medium text-ink": i.value === value,
                  "text-ink/60": i.value !== value,
                }
              )}
              data-testid="radio-label"
              data-active={i.value === value}
            >
              {i.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup
