'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

type LoginResponse = {
  token: string;
  name: string;
  role: string;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        'http://localhost:3000/users/login',
        { email, password },
        { withCredentials: true }  // Token will automatically be stored in cookies
      );

      setMessage('Login successful');

      // Redirect to dashboard or home after successful login
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      setMessage(error.response?.data.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="bg-white p-8 shadow-lg" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        {message && <p className="text-red-500">{message}</p>}

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
          Login
        </button>
      </form>
    </div>
  );
}
