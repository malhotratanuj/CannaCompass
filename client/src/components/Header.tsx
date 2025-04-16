import { FC, useState } from 'react';
import { Link, useLocation } from 'wouter';
import Logo from './Logo';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-gray-600 hover:text-primary-600 font-medium">
            Home
          </Link>
          <Link href="/mood-selection" className="text-gray-600 hover:text-primary-600 font-medium">
            Explore Strains
          </Link>
          <Link href="/store-finder" className="text-gray-600 hover:text-primary-600 font-medium">
            Find Stores
          </Link>
          <button className="text-gray-600 hover:text-primary-600 font-medium">About</button>
        </nav>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-6 w-6 text-primary-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Account
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              variant="default" 
              onClick={handleLogin}
              className="hidden md:flex"
            >
              Log In
            </Button>
          )}
          <button 
            className="p-2 md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-3">
            <Link href="/" className="block py-2 text-gray-600 hover:text-primary-600 font-medium">
              Home
            </Link>
            <Link href="/mood-selection" className="block py-2 text-gray-600 hover:text-primary-600 font-medium">
              Explore Strains
            </Link>
            <Link href="/store-finder" className="block py-2 text-gray-600 hover:text-primary-600 font-medium">
              Find Stores
            </Link>
            <button className="block py-2 text-gray-600 hover:text-primary-600 font-medium">About</button>
            {user ? (
              <div className="flex flex-col space-y-2 mt-2">
                <div className="py-2 px-3 bg-primary-50 rounded-md">
                  <p className="font-medium">Logged in as: {user.username}</p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </div>
            ) : (
              <Button 
                variant="default" 
                onClick={handleLogin}
                className="w-full mt-2"
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
