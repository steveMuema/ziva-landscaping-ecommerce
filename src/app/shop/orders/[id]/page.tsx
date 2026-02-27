import { Suspense } from 'react';
import OrderConfirmationSection from '@/sections/order_confirmation.section';


export default function OrderPage() {

  return (
    <Suspense fallback={<div className="text-[var(--muted)] p-8">Loading...</div>}>
      <OrderConfirmationSection />
    </Suspense>
  );
}