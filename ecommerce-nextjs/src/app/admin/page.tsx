'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Define the types for User, Product, and Stats
type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
};

type Stats = {
  totalSales: number;
  orders: number;
  customers: number;
  activeUsers: number;
  pendingOrders: number;
  lowStock: number;
  totalProducts: number;
  userGrowth: number;
  orderGrowth: number;
  salesGrowth: number;
  productGrowth: number;
  pendingGrowth: number;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showUsers, setShowUsers] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [userPage, setUserPage] = useState(1);       // Current user page
  const [userTotalPages, setUserTotalPages] = useState(1); // Total user pages
  const [productPage, setProductPage] = useState(1);  // Current product page
  const [productTotalPages, setProductTotalPages] = useState(1); // Total product pages
  const [limit] = useState(10); // Items per page

  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    orders: 0,
    customers: 0,
    activeUsers: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStock: 0,
    userGrowth: 0,
    orderGrowth: 0,
    salesGrowth: 0,
    productGrowth: 0,
    pendingGrowth: 0,
  });
  const router = useRouter();
  // Function to check token expiration
  const checkTokenExpiration = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));

    if (token) {
      const jwtToken = token.split('=')[1];
      const decodedToken = JSON.parse(atob(jwtToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
  
      if (decodedToken.exp < currentTime) {
        // Token expired, try refreshing
        axios.post('/api/auth/refresh-token', {}, { withCredentials: true })
          .then(response => {
            console.log('Token refreshed successfully');
          })
          .catch(() => {
            alert('Session expired. Please log in again.');
            document.cookie = 'token=; Max-Age=0';
            document.cookie = 'refreshToken=; Max-Age=0';
            window.location.href = '/login';
          });
      }
    }
  };
  // Run this in useEffect to periodically check token expiration
useEffect(() => {
  checkTokenExpiration();
  const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000); // Check every 5 minutes
  return () => clearInterval(interval);
}, []);
  useEffect(() => {
     // Check for token expiration first
    checkTokenExpiration();
    axios.get('http://localhost:3000/api/admin-dashboard/stats', {
      withCredentials: true,  // Include cookies in the request
    })
    .then(response => {
      setStats(response.data as Stats);  // This will update your stats state
      console.log('API Response:', response.data);
    })
    .catch(error => {
      console.error('Error fetching stats:', error);
    });
  
    // Fetch users with pagination
axios.get<{ users: User[]; totalPages: number; currentPage: number }>(
  `http://localhost:3000/api/admin-dashboard/users?page=${userPage}&limit=${limit}`,  // Include page and limit
  { withCredentials: true }
)
  .then(response => {
    setUsers(response.data.users);  // Access users array correctly
    setTotalUsers(response.data.users.length);  // Set total user count
    setUserTotalPages(response.data.totalPages);  // Set total pages
    console.log('Users API Response:', response.data); 
  })
  .catch(error => console.error(error));

// Fetch products with pagination
axios.get<{ products: Product[]; totalPages: number; currentPage: number }>(
  `http://localhost:3000/api/admin-dashboard/products?page=${productPage}&limit=${limit}`,  // Include page and limit
  { withCredentials: true }
)
  .then(response => {
    setProducts(response.data.products);  // Access products array correctly
    setTotalProducts(response.data.products.length);  // Set total product count
    setProductTotalPages(response.data.totalPages);  // Set total pages
    console.log('Products API Response:', response.data); 
  })
  .catch(error => console.error(error));
  }, [router]);
  
    return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="w-1/4 bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        <ul>
          <li className="py-2 cursor-pointer" onClick={() => { setShowUsers(false); setShowProducts(false); }}>Dashboard</li>
          <li className="py-2 cursor-pointer" onClick={() => { setShowUsers(true); setShowProducts(false); }}>User Management</li>
          <li className="py-2 cursor-pointer" onClick={() => { setShowProducts(true); setShowUsers(false); }}>Product Management</li>
        </ul>
      </nav>

      {/* Main content */}
      <div className="w-3/4 bg-gray-100 p-6">
        {/* Show stats if neither user management nor product management is selected */}
        {!showUsers && !showProducts && (
          <>
      <div className="grid grid-cols-3 gap-6">
  {/* Total Sales */}
  <div className="bg-blue-200 p-6 rounded-lg shadow-md col-span-3 md:col-span-1 md:row-span-2"> {/* Takes 2 rows */}
    <h3 className="text-2xl font-bold">Total Sales</h3>
    <p className="text-4xl">${stats.totalSales.toFixed(2)}</p>
    <p className="text-blue-700">+{stats.salesGrowth}% Last Month</p>
  </div>
           {/* Total Users */}
        <div className="bg-green-200 p-6 rounded-lg shadow-md">
         <h3 className="text-2xl font-bold">Total Users</h3>
         <p className="text-3xl">{stats.customers}</p>
       </div>

  {/* Total Orders */}
  <div className="bg-purple-200 p-6 rounded-lg shadow-md">
    <h3 className="text-2xl font-bold">Total Orders</h3>
    <p className="text-3xl">{stats.orders}</p>
  </div>

        {/* Total Products */}
        <div className="bg-blue-200 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold">Total Products</h3>
          <p className="text-4xl">{stats.pendingOrders}</p>
          <p className="text-blue-700">+{stats.productGrowth}% Last Month</p>
        </div>
        {/* Low stock orders */}
        <div className="bg-blue-200 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold">Low Stock Products</h3>
          <p className="text-4xl">{stats.lowStock}</p>
        </div>
        {/* Pending Orders */}
        <div className="bg-blue-200 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold">Pending Orders</h3>
          <p className="text-4xl">{stats.pendingOrders}</p>
          <p className="text-blue-700">+{stats.pendingGrowth}% Last Month</p>
        </div>
      </div>
          </>
        )}

{/* User Management */}
{showUsers && (
  <section id="user-management">
    <h2 className="text-2xl font-bold mb-4">User Management</h2>
    <table className="table-auto w-full mb-8">
      <thead>
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Email</th>
          <th className="px-4 py-2">Role</th>
          <th className="px-4 py-2">Verified</th>
          <th className="px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.isArray(users) && users.length > 0 ? (
          users.map(user => (
            <tr key={user._id}>
              <td className="border px-4 py-2">{user.name}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.role}</td>
              <td className="border px-4 py-2">{user.isVerified ? 'Yes' : 'No'}</td>
              <td className="border px-4 py-2">
                <button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">Edit</button>
                <button className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded ml-2">Delete</button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center py-4">No users found</td>
          </tr>
        )}
      </tbody>
    </table>
    {/* Pagination Controls for Users */}
<div className="flex justify-center mt-4">
  <button
    className="px-4 py-2 bg-gray-300"
    onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}  // Go to previous page
    disabled={userPage === 1}  // Disable if on first page
  >
    Previous
  </button>
  <span className="px-4 py-2">Page {userPage} of {userTotalPages}</span>
  <button
    className="px-4 py-2 bg-gray-300"
    onClick={() => setUserPage(prev => Math.min(prev + 1, userTotalPages))}  // Go to next page
    disabled={userPage === userTotalPages}  // Disable if on last page
  >
    Next
  </button>
</div>
  </section>
)}

{/* Product Management */}
{showProducts && (
  <section id="product-management">
    <h2 className="text-2xl font-bold mb-4">Product Management</h2>
    <table className="table-auto w-full">
      <thead>
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Price</th>
          <th className="px-4 py-2">Category</th>
          <th className="px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.isArray(products) && products.length > 0 ? (
          products.map(product => (
            <tr key={product._id}>
              <td className="border px-4 py-2">{product.name}</td>
              <td className="border px-4 py-2">${product.price}</td>
              <td className="border px-4 py-2">{product.category}</td>
              <td className="border px-4 py-2">
                <button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">Edit</button>
                <button className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded ml-2">Delete</button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="text-center py-4">No products found</td>
          </tr>
        )}
      </tbody>
    </table>
    {/* Pagination Controls for Products */}
<div className="flex justify-center mt-4">
  <button
    className="px-4 py-2 bg-gray-300"
    onClick={() => setProductPage(prev => Math.max(prev - 1, 1))}  // Go to previous page
    disabled={productPage === 1}  // Disable if on first page
  >
    Previous
  </button>
  <span className="px-4 py-2">Page {productPage} of {productTotalPages}</span>
  <button
    className="px-4 py-2 bg-gray-300"
    onClick={() => setProductPage(prev => Math.min(prev + 1, productTotalPages))}  // Go to next page
    disabled={productPage === productTotalPages}  // Disable if on last page
  >
    Next
  </button>
</div>
  </section>
)}

      </div>
    </div>
  );
}
