import { cookies } from 'next/headers';
import Footer from '@/components/Footer';
import CheckoutSection from '@/sections/checkout.section';
import { getCart } from '@/lib/api'; // From api.ts
import { Cart } from '@/types'; // From index.ts

export const revalidate = 60; // Updated to 60 seconds for better caching                                                                                   
async function fetchCartData(): Promise<Cart[]> {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get('clientId')?.value;
    if (!clientId) {
      console.error('No clientId found in cookies');
      return [];
    }
    const cartItems = await getCart(clientId);
    return cartItems;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
}

export default async function CheckoutPage() {
  const cartItems = await fetchCartData();

  return (
    <>
      <CheckoutSection cartItems={cartItems} />
      <Footer />
    </>
  );
}