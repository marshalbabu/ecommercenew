'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';  // Use from next/navigation

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post<{ message: string }>('http://localhost:3000/users/register', {
        name,
        email,
        password,
      });
      setMessage(response.data.message);  // Show success message

      // Redirect to login after successful signup
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setMessage(error.response?.data.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="bg-white p-8 shadow-lg" onSubmit={handleSignup}>
        <h2 className="text-2xl font-bold mb-6">Signup</h2>

        {message && <p className="text-red-500">{message}</p>}

        <input
          type="text"
          className="border p-2 mb-4 w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          className="border p-2 mb-4 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="border p-2 mb-4 w-full"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
          Signup
        </button>
      </form>
    </div>
  );
}
