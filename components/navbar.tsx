"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserDropdown } from "@/components/user-dropdown"
import { useAuth } from "@/lib/auth"

interface NavbarProps {
  currentPage?: 'home' | 'search' | 'favorites' | 'dashboard' | 'list-property'
}

export function Navbar({ currentPage = 'home' }: NavbarProps) {
  const router = useRouter()
  const { user, profile } = useAuth()

  const handlePostListing = () => {
    if (user) {
      router.push("/list-property")
    } else {
      router.push("/login")
    }
  }

  const isLandlord = profile?.role === 'landlord'
  const isLoadingProfile = user && !profile

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">C8</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Casa8</span>
          </Link>

          <div className="flex items-center justify-center flex-1">
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'home' ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/search" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'search' ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                Search
              </Link>
              <Link 
                href="/favorites" 
                className={`hover:text-primary transition-colors ${
                  currentPage === 'favorites' ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                Favorites
              </Link>
              {/* Show Dashboard for landlords and while profile is loading */}
              {(isLandlord || isLoadingProfile) && (
                <Link 
                  href="/dashboard" 
                  className={`hover:text-primary transition-colors ${
                    currentPage === 'dashboard' ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Mobile favorites button */}
                <Link href="/favorites" className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                </Link>
                
                {/* Mobile dashboard button for landlords */}
                {(isLandlord || isLoadingProfile) && (
                  <Link href="/dashboard" className="md:hidden">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                
                {/* Post Listing button for landlords */}
                {(isLandlord || isLoadingProfile) && (
                  <Button 
                    className="bg-primary hover:bg-primary/90 font-medium px-6" 
                    onClick={handlePostListing}
                  >
                    <span className="hidden sm:inline">Post Listing</span>
                    <span className="sm:hidden">Post</span>
                  </Button>
                )}
                
                <UserDropdown />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="font-medium bg-transparent">
                    Sign Up
                  </Button>
                </Link>
                <Button className="bg-primary hover:bg-primary/90 font-medium px-6" onClick={handlePostListing}>
                  <span className="hidden sm:inline">Post Listing</span>
                  <span className="sm:hidden">Post</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
