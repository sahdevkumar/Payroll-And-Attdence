import { useState } from 'react';
import { DollarSign, Download, Calculator } from 'lucide-react';

export default function Payroll() {
  const [payroll, setPayroll] = useState([
    { id: 'EMP001', name: 'John Doe', daysWorked: 22, basicSalary: 5000, deductions: 200, netPay: 4800 },
    { id: 'EMP002', name: 'Jane Smith', daysWorked: 20, basicSalary: 4500, deductions: 150, netPay: 4350 },
  ]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Payroll Management</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Calculate and manage employee salaries based on attendance.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center justify-center rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700">
            <Download className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            <Calculator className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Run Payroll
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <select className="block w-48 rounded-md border-0 py-2 pl-3 pr-10 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-emerald-600 sm:text-sm sm:leading-6">
          <option>June 2024</option>
          <option>May 2024</option>
          <option>April 2024</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:pl-6">
                Employee
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Days Worked
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Basic Salary
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Deductions
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Net Pay
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {payroll.map((record) => (
              <tr key={record.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{record.name}</div>
                      <div className="text-zinc-500 dark:text-zinc-400">{record.id}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-zinc-500 dark:text-zinc-400">
                  {record.daysWorked}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-zinc-500 dark:text-zinc-400">
                  ${record.basicSalary.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-500 dark:text-red-400">
                  -${record.deductions.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-semibold text-zinc-900 dark:text-zinc-100">
                  ${record.netPay.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
