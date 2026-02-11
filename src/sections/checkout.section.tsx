"use client";
import React, { Suspense, useState } from 'react';
import { Cart } from '@/types';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { useCreateOrder } from '@/lib/order';
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { useRouter } from 'next/navigation';

const PRICING_THRESHOLD_KSH = 10000;
const DOWN_PAYMENT_RATIO = 0.5;

interface CheckoutSectionProps {
  cartItems: Cart[];
}

const CheckoutSection: React.FC<CheckoutSectionProps> = ({ cartItems }) => {
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CASH'>('CASH');
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const { items, updateCart, clearCart } = useCart();
  const { createOrder, loading, error, setError } = useCreateOrder();
  const router = useRouter();
  const clientId = typeof window !== "undefined" ? document.cookie
    .split('; ')
    .find((row) => row.startsWith('clientId='))
    ?.split('=')[1] || '' : '';

  const orderItems = (items.length > 0 ? items : cartItems).map((item) => ({
    id: item.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.imageUrl || '/images/placeholder-landscaping.jpg',
    productId: item.productId,
    stock: item.product.stock,
  }));

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiredAmountNow = subtotal < PRICING_THRESHOLD_KSH
    ? subtotal
    : Math.round(subtotal * DOWN_PAYMENT_RATIO * 100) / 100;
  const isFullPayment = subtotal < PRICING_THRESHOLD_KSH;

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      setLoadingItems((prev) => new Set(prev).add(productId));
      await updateCart(productId, newQuantity);
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleCheckout = async () => {
    const phoneTrimmed = phone.trim();
    const locationTrimmed = location.trim();
    if (!phoneTrimmed || !locationTrimmed) return;
    if (!clientId) return;

    try {
      if (paymentMethod === 'MPESA') {
        const orderId = await createOrder({
          clientId,
          phone: phoneTrimmed,
          location: locationTrimmed,
          items: orderItems.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
          subtotal,
          paymentMethod: 'MPESA',
          amountPaid: 0,
        });
        if (!orderId) return;
        const stkRes = await fetch('/api/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            phone: phoneTrimmed.replace(/\D/g, '').slice(-9),
            amount: requiredAmountNow,
          }),
        });
        if (!stkRes.ok) {
          const err = await stkRes.json().catch(() => ({}));
          setError(err?.error || 'M-Pesa initiation failed. You can pay on delivery for this order.');
        }
        await clearCart();
        router.push(`/shop/orders/${orderId}`);
        return;
      }
      const orderId = await createOrder({
        clientId,
        phone: phoneTrimmed,
        location: locationTrimmed,
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        paymentMethod: 'CASH',
        amountPaid: 0,
      });
      if (orderId) {
        await clearCart();
        router.push(`/shop/orders/${orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 p-2 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-[var(--card-bg)] rounded-lg p-4 sm:p-6 shadow-sm border border-[var(--card-border)]">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 font-[family-name:var(--font-quicksand)]">Payment details</h2>
              <p className="text-sm text-[var(--muted)] mb-4 font-[family-name:var(--font-quicksand)]">
                We only collect your phone number and delivery location at checkout.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-[var(--card-border)] rounded-lg text-[var(--foreground)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors duration-200"
                    placeholder="e.g. 07XX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-2">
                    Delivery location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-[var(--card-border)] rounded-lg text-[var(--foreground)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors duration-200"
                    placeholder="Area, address, or landmark for delivery"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--card-bg)] rounded-lg p-4 sm:p-6 shadow-sm border border-[var(--card-border)]">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-4 font-[family-name:var(--font-quicksand)]">Payment (KSH)</h2>
              <p className="text-sm text-[var(--muted)] mb-4 font-[family-name:var(--font-quicksand)]">
                Orders under KSH 10,000: pay in full. Orders KSH 10,000 and above: 50% down payment now, rest on delivery.
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-lg cursor-pointer hover:bg-[var(--muted-bg)]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'MPESA'}
                    onChange={() => setPaymentMethod('MPESA')}
                    className="text-[var(--accent)]"
                  />
                  <span className="font-[family-name:var(--font-quicksand)]">Pay with M-Pesa now — KSH {requiredAmountNow.toFixed(2)}</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-lg cursor-pointer hover:bg-[var(--muted-bg)]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="text-[var(--accent)]"
                  />
                  <span className="font-[family-name:var(--font-quicksand)]">Pay in cash on delivery</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCheckout}
                disabled={loading || orderItems.length === 0}
                className="w-full bg-[var(--accent)] hover:opacity-90 text-white font-semibold py-3 font-[family-name:var(--font-quicksand)] sm:py-4 px-4 sm:px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <Suspense fallback={<div className="bg-[var(--muted-bg)] rounded-lg p-4 sm:p-6 text-[var(--muted)]">Loading order summary...</div>}>
              <div className="bg-[var(--muted-bg)] rounded-lg p-4 sm:p-6 border border-[var(--card-border)]">
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 font-[family-name:var(--font-quicksand)]">Order summary</h2>
                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                  {orderItems.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm sm:text-base font-[family-name:var(--font-quicksand)]">Your cart is empty</p>
                  ) : (
                    orderItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="object-cover sm:w-16 sm:h-16"
                            loader={item.image?.startsWith("https://res.cloudinary.com") ? cloudinaryLoader : undefined}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[var(--foreground)] text-sm sm:text-base truncate font-[family-name:var(--font-quicksand)]">{item.name}</h3>
                          <div className="flex items-center mt-1 sm:mt-2">
                            <label htmlFor={`quantity-${item.id}`} className="text-xs sm:text-sm text-[var(--muted)] font-[family-name:var(--font-quicksand)] mr-2">
                              Quantity:
                            </label>
                            {loadingItems.has(item.productId) ? (
                              <div className="w-16 h-6 sm:h-8 bg-[var(--card-border)] animate-pulse rounded-lg" />
                            ) : (
                              <div className="flex items-center space-x-2 sm:space-x-4">
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--muted-bg)] text-[var(--foreground)] font-[family-name:var(--font-quicksand)] rounded-full hover:opacity-80 disabled:opacity-50"
                                  aria-label="Decrease quantity"
                                >
                                  <span className="text-lg sm:text-xl">-</span>
                                </button>
                                <span className="text-base sm:text-lg font-medium w-10 sm:w-12 text-[var(--foreground)] text-center font-[family-name:var(--font-quicksand)]">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--muted-bg)] text-[var(--foreground)] rounded-full hover:opacity-80 disabled:opacity-50"
                                  aria-label="Increase quantity"
                                >
                                  <span className="text-lg sm:text-xl">+</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {loadingItems.has(item.productId) ? (
                          <div className="w-16 sm:w-20 h-5 sm:h-6 bg-[var(--card-border)] animate-pulse rounded-lg" />
                        ) : (
                          <div className="font-semibold text-[var(--foreground)] text-sm sm:text-base font-[family-name:var(--font-quicksand)]">
                            Kshs. {(item.price * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-[var(--card-border)] pt-4 sm:pt-6 space-y-4">
                  <div className="flex justify-between text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                    <span>Subtotal</span>
                    {loadingItems.size > 0 ? (
                      <div className="w-20 sm:w-24 h-5 sm:h-6 bg-[var(--card-border)] animate-pulse rounded-lg" />
                    ) : (
                      <span>KSH {subtotal.toFixed(2)}</span>
                    )}
                  </div>
                  {!isFullPayment && (
                    <div className="flex justify-between text-sm text-amber-700 font-[family-name:var(--font-quicksand)]">
                      <span>Due now (50%)</span>
                      <span>KSH {requiredAmountNow.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-semibold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] pt-2 border-t border-[var(--card-border)]">
                    <span>Total</span>
                    {loadingItems.size > 0 ? (
                      <div className="w-20 sm:w-24 h-5 sm:h-6 bg-[var(--card-border)] animate-pulse rounded-lg" />
                    ) : (
                      <span>KSH {subtotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSection;