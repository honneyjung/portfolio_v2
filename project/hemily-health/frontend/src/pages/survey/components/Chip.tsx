interface ChipProps {
  label:     string
  selected:  boolean
  onClick:   () => void
  disabled?: boolean
}

export function Chip({ label, selected, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-full text-body-sm font-medium transition-colors
        ${selected
          ? 'bg-blue text-white'
          : 'bg-white border border-gray-300 text-gray-800'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      {label}
    </button>
  )
}
