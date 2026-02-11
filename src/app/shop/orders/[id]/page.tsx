import { Suspense } from 'react';
import OrderConfirmationSection from '@/sections/order_confirmation.section';
import Footer from '@/components/Footer';


export default function OrderPage() {
 
  return (
    <div className="flex flex-col flex-1 min-h-full">
      <div className="flex-1">
        <Suspense fallback={<div className="text-[var(--muted)] p-8">Loading...</div>}>
          <OrderConfirmationSection />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}