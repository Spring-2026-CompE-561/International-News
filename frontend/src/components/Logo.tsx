import Link from 'next/link'
import { Globe } from 'lucide-react'

export function LogoMobile() {
  return (
    <Link href="/" className="flex items-center">
      <Globe className="w-8 h-8 text-[#F59E0B] dark:text-[#0F172A] hover:text-[#D97706] transition-colors" />
    </Link>
  )
}

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <Globe className="w-8 h-8 text-[#F59E0B] dark:text-[#0F172A] hover:text-[#D97706] transition-colors" />
      <h1 className="ml-2 text-3xl font-serif font-bold text-black dark:text-white whitespace-nowrap hover:text-[#F59E0B] transition-colors">
        On The Horizon
      </h1>
    </Link>
  )
}