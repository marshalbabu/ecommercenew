import axios from 'axios';
import { useRouter } from 'next/navigation'; // Update this import
import { useEffect, useState } from 'react';

interface NavbarProps {
  userRole: string;
  userName: string;
}

export default function Navbar({ userRole, userName }: NavbarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter(); // Updated router import

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    axios.get('http://localhost:3000/users/logout', { withCredentials: true }) // Ensure credentials are sent
      .then(() => {
        localStorage.removeItem('token');  // Remove token from localStorage
        localStorage.removeItem('user');   // Remove user data from localStorage
        router.push('/login'); // Redirect to login page after logout
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  };

  if (!isMounted) return null;

  return (
    <nav className="bg-white shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-2xl font-bold text-gray-600 hover:text-blue-500">SEEKARMI</a>
        
        <ul className="flex space-x-6 text-sm">
          {userName && <li className="text-gray-600">Welcome, {userName}</li>}
          {!userName && <li><a href="/login" className="text-gray-600 hover:text-blue-500">Login</a></li>}
          {!userName && <li><a href="/signup" className="text-gray-600 hover:text-blue-500">Create an Account</a></li>}
          {userRole === 'admin' && <li><a href="/admin" className="text-gray-600 hover:text-blue-500">Admin Panel</a></li>}
          <li><a href="/cart" className="text-gray-600 hover:text-blue-500">Cart</a></li>
          {userName && <li><button onClick={handleLogout} className="text-gray-600 hover:text-red-500">Logout</button></li>}
        </ul>
      </div>
    </nav>
  );
}
