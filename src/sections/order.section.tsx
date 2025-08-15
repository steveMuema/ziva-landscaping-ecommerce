"use client";

import { useOrder } from "@/lib/order";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

export default function OrderSection() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-sm font-[family-name:var(--font-quicksand)]">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-sm font-[family-name:var(--font-quicksand)]">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 p-2 overflow-x-hidden">
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 font-[family-name:var(--font-quicksand)]">Order #{order.id}</h1>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-medium text-gray-900 mb-4 font-[family-name:var(--font-quicksand)]">Order Details</h2>
            <p>
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Status:</strong>{" "}
              <span
                className={
                  order.status === "PENDING"
                    ? "text-yellow-500 font-[family-name:var(--font-quicksand)]"
                    : order.status === "SHIPPED"
                    ? "text-blue-500 font-[family-name:var(--font-quicksand)]"
                    : "text-green-500 font-[family-name:var(--font-quicksand)]"
                }
              >
                {order.status}
              </span>
            </p>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Created At:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Subtotal:</strong> Kshs. {order.subtotal.toFixed(2)}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-gray-900 mb-4 font-[family-name:var(--font-quicksand)]">
              Shipping Information
            </h2>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Full Name:</strong> {order.fullname}
            </p>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Email:</strong> {order.email}
            </p>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Phone:</strong> {order.phone}
            </p>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Company:</strong> {order.company || "N/A"}
            </p>
            <p className="text-gray-500 font-[family-name:var(--font-quicksand)]">
              <strong className="text-gray-500 font-[family-name:var(--font-quicksand)]">Address:</strong> {order.address},{" "}
              {order.apartment || ""}, {order.city}, {order.state},{" "}
              {order.postalCode}, {order.country}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-gray-900 mb-4 font-[family-name:var(--font-quicksand)]">Order Items</h2>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-4 border-b pb-4"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={
                        item.product.imageUrl ||
                        "/images/placeholder-landscaping.jpg"
                      }
                      alt={item.product.name}
                      width={64}
                      height={64}
                      loader={cloudinaryLoader}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base font-[family-name:var(--font-quicksand)] truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 text-sm sm:text-base font-[family-name:var(--font-quicksand)]">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500 text-sm sm:text-base font-[family-name:var(--font-quicksand)]">
                      Price: Kshs. {item.price.toFixed(2)}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base font-[family-name:var(--font-quicksand)]">
                      Total: Kshs. {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
