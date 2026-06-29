import clsx from 'clsx'

/** tabs: [{ key, label }] */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            'whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'border-b-2 border-amber text-amber'
              : 'border-b-2 border-transparent text-muted hover:text-paper',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
