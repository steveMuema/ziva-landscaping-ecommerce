"use client";

import { useOrders, useUpdateOrderStatus, useDeleteOrder } from "@/lib/order";
import Link from "next/link";
import { ArrowPathIcon, TrashIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function OrdersPage() {
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { updateOrderStatus, loading: updateLoading, error: updateError } = useUpdateOrderStatus();
  const { deleteOrder, loading: deleteLoading, error: deleteError } = useDeleteOrder();

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await deleteOrder(orderId);
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const loading = ordersLoading || updateLoading || deleteLoading;
  const error = ordersError || updateError || deleteError;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Orders</h1>
      {loading && (
        <div className="flex justify-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && orders.length === 0 && !error && (
        <p className="text-gray-600">No orders found.</p>
      )}
      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Order #{order.id}</span>
                <span className={`text-sm font-medium ${order.status === "pending" ? "text-yellow-500" : order.status === "shipped" ? "text-blue-500" : "text-green-500"}`}>
                  {order.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-2">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-gray-600 mb-2">Total: ${order.subtotal.toFixed(2)}</p>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Items:</h3>
                <ul className="list-disc pl-5">
                  {order.orderItems.map((item) => (
                    <li key={item.productId} className="text-gray-600">
                      {item.product.name} - {item.quantity} x ${item.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex space-x-4">
                <Link href={`/orders/${order.id}`}>
                  <button className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors">
                    View Details <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </Link>
                {order.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, "cancelled")}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      disabled={updateLoading}
                    >
                      Cancel Order
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      disabled={deleteLoading}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
