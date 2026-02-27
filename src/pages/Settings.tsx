import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('http://43.225.52.40:81');
  const [token, setToken] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('biometric_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('biometric_token', token);
    toast.success('Settings saved successfully.');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure biometric device API connection.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="apiUrl" className="block text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100">
                API Base URL
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-600 sm:max-w-md">
                  <input
                    type="text"
                    name="apiUrl"
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="http://43.225.52.40:81"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="token" className="block text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100">
                Authentication Token
              </label>
              <div className="mt-2">
                <textarea
                  id="token"
                  name="token"
                  rows={3}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Bearer token used for all API requests.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-6 border-t border-zinc-200 dark:border-zinc-800 px-4 py-4 sm:px-8">
          <button type="button" className="text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Save className="-ml-0.5 mr-1.5 h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
