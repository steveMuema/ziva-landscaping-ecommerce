import { cookies } from 'next/headers';
import Footer from '@/components/Footer';
import CheckoutSection from '@/sections/checkout.section';
import { getCart } from '@/lib/api'; // From api.ts
import { Cart } from '@/types'; // From index.ts

export const dynamic = "force-dynamic";

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
    <div className="flex flex-col flex-1 min-h-full">
      <div className="flex-1">
        <CheckoutSection cartItems={cartItems} />
      </div>
      <Footer />
    </div>
  );
}