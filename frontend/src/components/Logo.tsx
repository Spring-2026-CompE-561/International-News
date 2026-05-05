import Link from 'next/link'
import { Globe } from 'lucide-react'

export function LogoMobile() {
  return (
    <Link href="/" className="flex items-center">
      <Globe className="w-8 h-8 text-horizon hover:text-horizon-dark transition-colors" />
    </Link>
  )
}

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <Globe className="w-8 h-8 text-horizon hover:text-horizon-dark transition-colors" />
      <h1 className="ml-2 text-3xl font-serif font-bold text-black dark:text-white whitespace-nowrap hover:text-horizon transition-colors">
        On The Horizon
      </h1>
    </Link>
  )
}