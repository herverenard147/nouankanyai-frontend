interface ChartTooltipProps {
  text: string
  visible: boolean
  radiusClassName: string
}

export function ChartTooltip({ text, visible, radiusClassName }: ChartTooltipProps) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-dark-bg px-2.5 py-1 font-mono text-mono-badge text-white transition-opacity duration-100 ease-out ${radiusClassName}`}
      style={{ opacity: visible ? 1 : 0 }}
      role="tooltip"
    >
      {text}
    </div>
  )
}
