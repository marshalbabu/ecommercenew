'use client';

import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the type for a Product
type Product = {
  _id: string;
  name: string;
  image: string;
  price: number;
};

// Declare global window functions
declare global {
  interface Window {
    slideRight: () => void;
    slideLeft: () => void;
  }
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showCategories, setShowCategories] = useState(false); // For expanding categories
  const [userRole, setUserRole] = useState(''); // User role state
  const [userName, setUserName] = useState(''); // User name state

  useEffect(() => {
    // Fetch products
    axios.get<Product[]>('http://localhost:3000/products')
      .then(response => setProducts(response.data))
      .catch(error => console.error(error));

    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData && userData.role && userData.name) {
      setUserRole(userData.role); // Set role from user data
      setUserName(userData.name); // Set username from user data
    }

    // Slider functionality
    const slideRight = () => {
      const slider = document.getElementById("slider");
      if (slider) slider.scrollLeft += slider.offsetWidth;
    };

    const slideLeft = () => {
      const slider = document.getElementById("slider");
      if (slider) slider.scrollLeft -= slider.offsetWidth;
    };

    // Attach slider functions globally
    window.slideRight = slideRight;
    window.slideLeft = slideLeft;
  }, []);

  return (
    <div className="min-h-screen bg-[#f3efe1] text-gray-900">
      {/* Pass userRole and userName to Navbar */}
      <Navbar userRole={userRole} userName={userName} />

      {/* Search Bar with Category Dropdown */}
      <div className="bg-[#e5e7e9] py-4">
        <div className="container mx-auto flex justify-center items-center">
          {/* Category Dropdown */}
          <select className="px-4 py-2 border rounded-lg">
            <option value="">All Categories</option>
            <option value="chairs">Chairs</option>
            <option value="tables">Tables</option>
            <option value="sofas">Sofas</option>
          </select>
          <input
            type="text"
            placeholder="Search Furniture..."
            className="px-6 py-3 w-2/5 text-gray-800 rounded-lg shadow-sm border-2 border-gray-300 ml-4"
          />
          <button className="ml-4 bg-[#1d1a1a] px-6 py-3 text-white rounded-lg hover:bg-[#6B4E3C]">
            Search
          </button>
        </div>
      </div>

      {/* New Product Slider */}
      <div className="bg-[#f9f9f9] py-10">
        <div className="container mx-auto">
          <div className="relative overflow-hidden w-[80%] mx-auto">
            <div className="flex transition-transform duration-500" id="slider">
              {/* Slide 1 */}
              <div className="min-w-full">
                <img src="https://via.placeholder.com/1200x400" alt="New Product 1" className="w-full" />
              </div>
              {/* Slide 2 */}
              <div className="min-w-full">
                <img src="https://via.placeholder.com/1200x400" alt="New Product 2" className="w-full" />
              </div>
            </div>
            {/* Arrows */}
            <button
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow"
              onClick={() => window.slideLeft()}
            >
              &#8249;
            </button>
            <button
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow"
              onClick={() => window.slideRight()}
            >
              &#8250;
            </button>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      {products.length > 0 && (
        <div className="container mx-auto py-8">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product._id} className="border p-4 shadow-sm">
                <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
                <h2 className="text-xl font-semibold mt-4">{product.name}</h2>
                <p className="text-gray-700 mt-2">${product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Categories Section */}
      <div className="container mx-auto py-16">
        <button
          className="bg-[#8B5E3C] text-white px-4 py-2 rounded-lg hover:bg-[#6B4E3C] mb-4"
          onClick={() => setShowCategories(!showCategories)}
        >
          {showCategories ? 'Hide Categories' : 'View Categories'}
        </button>

        {showCategories && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#d2b48c] text-center p-8 shadow-lg">
              <h3 className="text-2xl font-semibold">Chairs</h3>
            </div>
            <div className="bg-[#d2b48c] text-center p-8 shadow-lg">
              <h3 className="text-2xl font-semibold">Tables</h3>
            </div>
            <div className="bg-[#d2b48c] text-center p-8 shadow-lg">
              <h3 className="text-2xl font-semibold">Sofas</h3>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#8B5E3C] text-white py-8">
        <div className="container mx-auto text-center">
          <p>Subscribe to our Newsletter</p>
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-2 text-gray-800 rounded-lg mt-4"
          />
          <button className="ml-4 bg-[#6B4E3C] px-6 py-2 text-white rounded-lg hover:bg-[#57392D]">
            Subscribe
          </button>
        </div>
      </footer>
    </div>
  );
}
