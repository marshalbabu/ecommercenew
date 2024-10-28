  import { useState, useEffect } from 'react';
  import axios from 'axios';

  // Define the type for a Product
  type Product = {
    _id: string;
    name: string;
    image: string;
    price: number;
  };

  export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
      axios.get<Product[]>('http://localhost:5000/api/products')  // Add <Product[]>
        .then(response => setProducts(response.data))
        .catch(error => console.error(error));
    }, []);

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Our Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="border p-4 shadow-sm">
              <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
              <h2 className="text-xl font-semibold mt-4">{product.name}</h2>
              <p className="text-gray-700 mt-2">${product.price}</p>
              <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">Add to Cart</button>
            </div>
          ))}
        </div>
      </div>
    );
  }
