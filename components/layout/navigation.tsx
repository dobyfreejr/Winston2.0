'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Search, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  AlertTriangle,
  Database,
  Globe,
  FileText
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Threat Analysis', href: '/analysis', icon: Search },
  { name: 'Cases', href: '/cases', icon: FileText },
  { name: 'Indicators', href: '/indicators', icon: AlertTriangle },
  { name: 'Intelligence Feeds', href: '/feeds', icon: Database },
  { name: 'Network Analysis', href: '/network', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">SOC Platform</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            pathname === item.href
                              ? 'bg-gray-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <Icon
                            className={cn(
                              pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                              'h-6 w-6 shrink-0'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">SOC Platform</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">SOC Platform</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            pathname === item.href
                              ? 'bg-gray-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon
                            className={cn(
                              pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                              'h-6 w-6 shrink-0'
                            )}
                          />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}