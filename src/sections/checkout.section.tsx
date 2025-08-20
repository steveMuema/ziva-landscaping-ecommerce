"use client";
import React, { Suspense, useState } from 'react';
import { Cart } from '@/types';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { useCreateOrder } from '@/lib/order';
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { useRouter } from 'next/navigation';

interface CheckoutSectionProps {
  cartItems: Cart[];
}

const CheckoutSection: React.FC<CheckoutSectionProps> = ({ cartItems }) => {
  const [email, setEmail] = useState('');
  const [shippingData, setShippingData] = useState({
    fullname: '',
    phone: '',
    company: '',
    country: '',
    state: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
  });
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const { items, updateCart, clearCart } = useCart();
  const { createOrder, loading, error } = useCreateOrder();
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

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setShippingData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

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
    if (!email || !shippingData.fullname || !shippingData.phone || !shippingData.country || !shippingData.state || !shippingData.address || !shippingData.city || !shippingData.postalCode) {
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return;
    }

    if (!clientId) {
      console.error('No clientId found');
      return;
    }

    try {
      const orderId = await createOrder({
        clientId,
        email,
        shippingData,
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
      });
      if (orderId) {
        await clearCart();
        router.push(`/shop/orders/${orderId}`);
      }
    } catch (error) {
      console.error('Error in handleCheckout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 p-2 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 font-[family-name:var(--font-quicksand)]">Contact information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-[family-name:var(--font-quicksand)] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Shipping address</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="fullname"
                    value={shippingData.fullname}
                    onChange={(e) => handleInputChange('fullname', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={shippingData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={shippingData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 text-gray-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Company name (optional)"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={shippingData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-700 font-[family-name:var(--font-quicksand)] focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 font-[family-name:var(--font-quicksand)] mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={shippingData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-500 font-[family-name:var(--font-quicksand)] focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                    Apartment, suite, etc.
                  </label>
                  <input
                    type="text"
                    id="apartment"
                    value={shippingData.apartment}
                    onChange={(e) => handleInputChange('apartment', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg focus:ring-2 text-gray-500 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={shippingData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-500 font-[family-name:var(--font-quicksand)] focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                      State / Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={shippingData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 text-gray-500 font-[family-name:var(--font-quicksand)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                      placeholder="State / Province"
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2 font-[family-name:var(--font-quicksand)]">
                      Postal code
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={shippingData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-500 rounded-lg text-gray-500 font-[family-name:var(--font-quicksand)] focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                      placeholder="Postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCheckout}
                disabled={loading || orderItems.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 font-[family-name:var(--font-quicksand)] sm:py-4 px-4 sm:px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:bg-green-400"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <Suspense fallback={<div className="bg-gray-100 rounded-lg p-4 sm:p-6 text-gray-500">Loading order summary...</div>}>
              <div className="bg-gray-100 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 font-[family-name:var(--font-quicksand)]">Order summary</h2>
                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-sm sm:text-base font-[family-name:var(--font-quicksand)]">Your cart is empty</p>
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
                            loader={cloudinaryLoader}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate font-[family-name:var(--font-quicksand)]">{item.name}</h3>
                          <div className="flex items-center mt-1 sm:mt-2">
                            <label htmlFor={`quantity-${item.id}`} className="text-xs sm:text-sm text-gray-500 font-[family-name:var(--font-quicksand)] mr-2">
                              Quantity:
                            </label>
                            {loadingItems.has(item.productId) ? (
                              <div className="w-16 h-6 sm:h-8 bg-gray-200 animate-pulse rounded-lg" />
                            ) : (
                              <div className="flex items-center space-x-2 sm:space-x-4">
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 text-gray-700 font-[family-name:var(--font-quicksand)] rounded-full hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                                  aria-label="Decrease quantity"
                                >
                                  <span className="text-lg sm:text-xl">-</span>
                                </button>
                                <span className="text-base sm:text-lg font-medium w-10 sm:w-12 text-gray-900 text-center font-[family-name:var(--font-quicksand)]">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                                  aria-label="Increase quantity"
                                >
                                  <span className="text-lg sm:text-xl">+</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {loadingItems.has(item.productId) ? (
                          <div className="w-16 sm:w-20 h-5 sm:h-6 bg-gray-200 animate-pulse rounded-lg" />
                        ) : (
                          <div className="font-semibold text-gray-900 text-sm sm:text-base font-[family-name:var(--font-quicksand)]">
                            Kshs. {(item.price * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 sm:pt-6 space-y-4">
                  <div className="flex justify-between text-base sm:text-lg font-semibold text-gray-900 font-[family-name:var(--font-quicksand)]">
                    <span>Subtotal</span>
                    {loadingItems.size > 0 ? (
                      <div className="w-20 sm:w-24 h-5 sm:h-6 bg-gray-200 animate-pulse rounded-lg" />
                    ) : (
                      <span>Kshs. {subtotal.toFixed(2)}</span>
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