import Navbar from '../../components/Navbar';
import '../styles/globals.css';
import { AppProps } from 'next/app';  // Import the correct types

export default function MyApp({ Component, pageProps }: AppProps) {  // Define types
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}

