import { Suspense } from 'react';
import OrderConfirmationSection from '@/sections/order_confirmation.section';
import Footer from '@/components/Footer';


export default function OrderPage() {
 
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <OrderConfirmationSection/>
      </Suspense>
      <Footer />
    </>
  );
}