/* eslint-disable react/no-unescaped-entities */
"use client";

import { useOrder } from "@/lib/order";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

export default function OrderConfirmationSection() {
  const params = useParams();
  const orderId = parseInt(params.id as string, 10);
  const { order, loading, error } = useOrder(orderId);

  if (!orderId || isNaN(orderId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-sm font-[family-name:var(--font-quicksand)]">
          Invalid order ID
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-[family-name:var(--font-quicksand)]">
            Loading your order details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-6 rounded-xl max-w-md">
            <h2 className="text-xl font-semibold mb-2 font-[family-name:var(--font-quicksand)]">
              Error Loading Order
            </h2>
            <p className="font-[family-name:var(--font-quicksand)]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-6 rounded-xl max-w-md">
            <h2 className="text-xl font-semibold mb-2 font-[family-name:var(--font-quicksand)]">
              Order Not Found
            </h2>
            <p className="font-[family-name:var(--font-quicksand)]">
              We couldn't find your order details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Interior Design Image */}
        <div className="lg:w-1/2 relative">
          <Image
            src="/image-4.jpg"
            alt="Interior Design"
            className="h-64 lg:h-full bg-cover bg-center relative"
            width={800}
            height={600}
          />
        </div>

        {/* Right Side - Order Details */}
        <div className="lg:w-1/2 bg-white">
          <div className="p-8 lg:p-12 h-full">
            {/* Success Message */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-quicksand)]">
                Thanks for ordering
              </h1>
              <p className="text-gray-600 font-[family-name:var(--font-quicksand)]">
                We appreciate your order, we're currently processing it. So hang tight and we'll send you confirmation very soon!
              </p>
            </div>
            {/* Order Progress */}
            <div className="mb-8">
              {(() => {
                const getProgressData = () => {
                  const steps = [
                    { key: 'PENDING', label: 'Order placed', completed: false, active: false },
                    { key: 'PROCESSING', label: 'Processing', completed: false, active: false },
                    { key: 'SHIPPED', label: 'Shipped', completed: false, active: false },
                    { 
                      key: 'DELIVERED', 
                      label: order.status === 'CANCELLED' ? 'Cancelled' : 'Delivered', 
                      completed: false, 
                      active: false 
                    }
                  ];

                  const currentStatus = order.status;
                  let progressColor = 'bg-yellow-500'; // Default processing color
                  let progressWidth = '25%'; // Default width

                  // Map your database statuses to progress steps
                  switch (currentStatus) {
                    case 'PENDING':
                      // Order is placed and being processed
                      steps[0].completed = true;
                      steps[1].active = true;
                      progressWidth = '50%';
                      progressColor = 'bg-yellow-500';
                      break;
                    case 'SHIPPED':
                      // Order has been shipped
                      steps[0].completed = true;
                      steps[1].completed = true;
                      steps[2].active = true;
                      progressWidth = '75%';
                      progressColor = 'bg-yellow-500';
                      break;
                    case 'DELIVERED':
                      // Order has been delivered
                      steps[0].completed = true;
                      steps[1].completed = true;
                      steps[2].completed = true;
                      steps[3].completed = true;
                      progressWidth = '100%';
                      progressColor = 'bg-green-500';
                      break;
                    case 'CANCELLED':
                      // Order cancelled - show full red progress
                      steps.forEach(step => step.completed = true);
                      progressWidth = '100%';
                      progressColor = 'bg-red-500';
                      break;
                    default:
                      // Fallback for any other status
                      steps[0].active = true;
                      progressWidth = '25%';
                      progressColor = 'bg-yellow-500';
                  }

                  return { steps, progressColor, progressWidth };
                };

                const { steps, progressColor, progressWidth } = getProgressData();

                return (
                  <div className="relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                    
                    {/* Progress Bar Fill */}
                    <div 
                      className={`absolute top-6 left-0 h-1 ${progressColor} rounded-full transition-all duration-500 ease-in-out`}
                      style={{ width: progressWidth }}
                    ></div>

                    {/* Progress Steps */}
                    <div className="relative flex justify-between">
                      {steps.map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center">
                          {/* Step Circle */}
                          <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                            step.completed 
                              ? `${progressColor} border-transparent` 
                              : step.active 
                                ? `bg-white ${progressColor.replace('bg-', 'border-')} border-2` 
                                : 'bg-white border-gray-300'
                          }`}></div>
                          
                          {/* Step Label */}
                          <div className="mt-3 text-center">
                            <span
                              className={`text-sm font-medium font-[family-name:var(--font-quicksand)] ${
                                order.status === 'DELIVERED'
                                  ? 'text-green-500'
                                  : order.status === 'CANCELLED'
                                  ? 'text-red-500'
                                  : step.completed || step.active
                                  ? 'text-yellow-500'
                                  : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Status Message */}
                    <div className="mt-6 text-center">
                      <p
                        className={`text-sm font-[family-name:var(--font-quicksand)] ${
                          order.status === 'DELIVERED'
                            ? 'text-green-500'
                            : order.status === 'CANCELLED'
                            ? 'text-red-500'
                            : 'text-gray-600'
                        }`}
                      >
                        {order.status === 'PENDING' && 'Your order has been placed and is awaiting confirmation.'}
                        {order.status === 'PROCESSING' && 'Your order is being processed and prepared for shipment.'}
                        {order.status === 'SHIPPED' && 'Your order has been shipped and is on its way to you.'}
                        {order.status === 'DELIVERED' && 'Your order has been successfully delivered.'}
                        {order.status === 'CANCELLED' && 'Your order has been cancelled.'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Order Items */}
            <div className="space-y-6 mb-8">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.imageUrl || "/images/placeholder-landscaping.jpg"}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      loader={cloudinaryLoader}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 font-[family-name:var(--font-quicksand)] truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-gray-500 text-sm font-[family-name:var(--font-quicksand)]">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 font-[family-name:var(--font-quicksand)]">
                      KSh {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900 font-[family-name:var(--font-quicksand)]">
                  Subtotal
                </span>
                <span className="text-lg font-semibold text-gray-900 font-[family-name:var(--font-quicksand)]">
                  KSh {order.subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 font-[family-name:var(--font-quicksand)]">
                    Shipping Address
                  </h3>
                  <div className="text-gray-600 space-y-1 font-[family-name:var(--font-quicksand)]">
                    <p className="font-medium text-gray-900">{order.fullname}</p>
                    <p>{order.address}{order.apartment && `, ${order.apartment}`}</p>
                    <p>{order.city}, {order.state} {order.postalCode}</p>
                    <p>{order.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Shopping Button */}
            <div className="pt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center text-emerald-600 hover:text-emerald-900 transition-colors font-medium font-[family-name:var(--font-quicksand)]"
              >
                Continue Shopping
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}