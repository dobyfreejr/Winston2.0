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
  { name: 'Admin Panel', href: '/admin', icon: Settings },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-foreground">SOC Platform</span>
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
                              ? 'bg-accent text-blue-600'
                              : 'text-muted-foreground hover:text-blue-600 hover:bg-accent',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <Icon
                            className={cn(
                              pathname === item.href ? 'text-blue-600' : 'text-muted-foreground group-hover:text-blue-600',
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

      {/* Mobile overlay for small screens */}
      <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
    </>
  )
}