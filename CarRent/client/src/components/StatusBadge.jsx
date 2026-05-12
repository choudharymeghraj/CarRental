import React from 'react'

const config = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400',  label: 'Pending'   },
  confirmed: { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-400',  label: 'Confirmed' },
  cancelled: { bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400',    label: 'Cancelled' },
  completed: { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400',   label: 'Completed' },
  // legacy fallbacks
  booked:    { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-400',  label: 'Booked'    },
}

const StatusBadge = ({ status }) => {
  const s = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export default StatusBadge
