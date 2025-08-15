import { Suspense } from 'react';
import OrderSection from '@/sections/order.section';
import Footer from '@/components/Footer';
// import { OrderProvider } from '@/lib/order';


export default function OrderPage() {
 
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <OrderSection/>
      </Suspense>
      <Footer />
    </>
  );
}