interface StatCardProps {
  title: string
  value: number | string
  icon: string
  color: 'pink' | 'blue' | 'green' | 'orange'
  subtitle?: string
}

const colorMap = {
  pink: 'bg-pink-50 text-pink-600 border-pink-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
    </div>
  )
}
