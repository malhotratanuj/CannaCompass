import { FC, useState } from 'react';
import { Link } from 'wouter';
import Logo from './Logo';
import { Menu, X } from 'lucide-react';

const Header: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <Logo />
          </a>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/">
            <a className="text-gray-600 hover:text-primary-600 font-medium">Home</a>
          </Link>
          <Link href="/mood-selection">
            <a className="text-gray-600 hover:text-primary-600 font-medium">Explore Strains</a>
          </Link>
          <Link href="/store-finder">
            <a className="text-gray-600 hover:text-primary-600 font-medium">Find Stores</a>
          </Link>
          <a href="#" className="text-gray-600 hover:text-primary-600 font-medium">About</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button className="hidden md:block px-4 py-2 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 font-medium transition duration-150 ease-in-out">
            Log In
          </button>
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
            <Link href="/">
              <a className="block py-2 text-gray-600 hover:text-primary-600 font-medium">Home</a>
            </Link>
            <Link href="/mood-selection">
              <a className="block py-2 text-gray-600 hover:text-primary-600 font-medium">Explore Strains</a>
            </Link>
            <Link href="/store-finder">
              <a className="block py-2 text-gray-600 hover:text-primary-600 font-medium">Find Stores</a>
            </Link>
            <a href="#" className="block py-2 text-gray-600 hover:text-primary-600 font-medium">About</a>
            <button className="w-full mt-2 py-2 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 font-medium transition duration-150 ease-in-out">
              Log In
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
