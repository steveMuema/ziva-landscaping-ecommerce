"use client";
import React, { Suspense, useState, useEffect } from 'react';
import { Cart } from '@/types';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { useCreateOrder } from '@/lib/order';
import { useRouter } from 'next/navigation';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { SETTING_KEYS } from '@/lib/setting-keys';

const DEFAULT_DELIVERY_FEE_KSH = 400;
const DEFAULT_WHATSAPP = "254757133726";

/** Normalize to digits with country code for wa.me (e.g. 254712345678). */
function normalizeWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) return "254" + digits;
  if (digits.length >= 10 && digits.startsWith("254")) return digits.slice(0, 12);
  if (digits.length >= 9) return "254" + digits.slice(-9);
  return value || DEFAULT_WHATSAPP;
}

interface CheckoutSectionProps {
  cartItems: Cart[];
}

const CheckoutSection: React.FC<CheckoutSectionProps> = ({ cartItems }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE_KSH);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP);
  const { items, updateCart, clearCart } = useCart();
  const { createOrder, loading, error, setError } = useCreateOrder();
  const router = useRouter();
  const clientId = typeof window !== "undefined" ? document.cookie
    .split('; ')
    .find((row) => row.startsWith('clientId='))
    ?.split('=')[1] || '' : '';

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.ok ? res.json() : {})
      .then((settings: Record<string, string>) => {
        const raw = settings[SETTING_KEYS.DELIVERY_FEE_KSH];
        const n = raw != null ? parseFloat(raw) : NaN;
        if (!Number.isNaN(n) && n >= 0) setDeliveryFee(n);

        const waRaw = (settings[SETTING_KEYS.SITE_PHONE_WHATSAPP] ?? "").trim();
        if (waRaw) setWhatsappNumber(normalizeWhatsApp(waRaw));
      })
      .catch(() => { });
  }, []);

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
  const total = subtotal + deliveryFee;

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

  /** Build and open a WhatsApp message with order details. */
  function sendWhatsAppOrderMessage(
    orderId: number,
    customerName: string,
    customerPhone: string,
    customerLocation: string,
    productsOrdered: { name: string; quantity: number }[],
  ) {
    const itemLines = productsOrdered
      .map((p, i) => `  ${i + 1}. ${p.name} x${p.quantity}`)
      .join("\n");

    const message = [
      `Hi, I'm *${customerName}* \u{1F44B}`,
      `I'd like to place the following order:`,
      ``,
      `*\u{1F6D2} Order #${orderId}*`,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `*\u260E Phone:* ${customerPhone}`,
      `*\u{1F4CD} Deliver to:* ${customerLocation}`,
      ``,
      `*\u{1F4E6} Items:*`,
      itemLines,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      ``,
      `Looking forward to your confirmation. Thank you! \u{1F64F}`,
    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const handleCheckout = async () => {
    const nameTrimmed = name.trim();
    const phoneTrimmed = phone.trim();
    const locationTrimmed = location.trim();
    if (!nameTrimmed || !phoneTrimmed || !locationTrimmed) return;
    if (!clientId) return;

    try {
      const orderId = await createOrder({
        clientId,
        phone: phoneTrimmed,
        location: locationTrimmed,
        fullname: nameTrimmed,
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        paymentMethod: 'PAY_ON_DELIVERY',
        amountPaid: 0,
      });
      if (orderId) {
        sendWhatsAppOrderMessage(orderId, nameTrimmed, phoneTrimmed, locationTrimmed, orderItems);
        await clearCart();
        router.push(`/shop/orders/${orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 py-4 sm:p-6 sm:py-6 lg:p-8 lg:py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-[var(--card-bg)] rounded-lg p-4 sm:p-6 shadow-sm border border-[var(--card-border)]">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 font-[family-name:var(--font-quicksand)]">Delivery details</h2>
              <p className="text-sm text-[var(--muted)] mb-4 font-[family-name:var(--font-quicksand)]">
                Enter your name, phone number, and delivery location to place your order.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-[var(--card-border)] rounded-lg text-[var(--foreground)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors duration-200"
                    placeholder="e.g. John Doe"
                  />
                </div>
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
                  <AddressAutocomplete
                    id="location"
                    value={location}
                    onChange={setLocation}
                    placeholder="Area, address, or landmark for delivery"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-[var(--card-border)] rounded-lg text-[var(--foreground)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors duration-200"
                  />
                </div>
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
                  <div className="flex justify-between text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                    <span>Delivery</span>
                    <span>KSH {deliveryFee.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-base sm:text-lg font-semibold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] pt-2 border-t border-[var(--card-border)]">
                    <span>Total</span>
                    {loadingItems.size > 0 ? (
                      <div className="w-20 sm:w-24 h-5 sm:h-6 bg-[var(--card-border)] animate-pulse rounded-lg" />
                    ) : (
                      <span>KSH {total.toFixed(2)}</span>
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