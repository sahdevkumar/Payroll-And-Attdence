import { Users, Monitor, Clock, AlertTriangle } from 'lucide-react';

const stats = [
  { name: 'Total Employees', value: '142', icon: Users, change: '+4.75%', changeType: 'positive' },
  { name: 'Active Devices', value: '5', icon: Monitor, change: '0%', changeType: 'neutral' },
  { name: 'Today Attendance', value: '128', icon: Clock, change: '-1.5%', changeType: 'negative' },
  { name: 'Failed Logs', value: '3', icon: AlertTriangle, change: '+2', changeType: 'negative' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Overview of your payroll and attendance system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 px-4 pt-5 pb-12 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-emerald-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'positive'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : item.changeType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}
