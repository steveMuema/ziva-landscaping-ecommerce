"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

const fmt = (n: number) =>
  Number(n).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export type OrderForBoard = {
  id: number;
  status: string;
  phone: string | null;
  location: string;
  address: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  subtotal: number;
  costTotal: number | null;
  transportFee: number | null;
  amountPaid: number | null;
  paymentMethod: string | null;
  mpesaReceiptNo: string | null;
  orderItems: { quantity: number; productId: number; product: { id: number; name: string; price: number } | null }[];
};

export type ColumnConfig = {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  label: string;
  bg: string;
  headerBg: string;
};

type Props = {
  orders: OrderForBoard[];
  columns: ColumnConfig[];
  byStatus: Record<string, OrderForBoard[]>;
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderCostTransport: (formData: FormData) => Promise<void>;
  recordCashPayment: (formData: FormData) => Promise<void>;
  setPaymentRef: (formData: FormData) => Promise<void>;
};

function formatAddress(order: OrderForBoard) {
  if (order.location) return order.location;
  const parts = [order.address, order.apartment, order.city, order.state, order.postalCode, order.country].filter(Boolean);
  return parts.join(", ") || "—";
}

function mapsUrl(order: OrderForBoard) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(order))}`;
}

function canCompleteOrder(order: OrderForBoard): boolean {
  const isCash = order.paymentMethod === "CASH";
  const hasRef = order.mpesaReceiptNo != null && String(order.mpesaReceiptNo).trim() !== "";
  return isCash || hasRef;
}

function DraggableCard({
  order,
  updateOrderStatus,
  updateOrderCostTransport,
  recordCashPayment,
  setPaymentRef,
  isDragging,
}: {
  order: OrderForBoard;
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderCostTransport: (formData: FormData) => Promise<void>;
  recordCashPayment: (formData: FormData) => Promise<void>;
  setPaymentRef: (formData: FormData) => Promise<void>;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(order.id),
    data: { order },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const cost = order.costTotal ?? 0;
  const transport = order.transportFee ?? 0;
  const sale = Number(order.subtotal);
  const profit = sale - cost - transport;
  const paid = order.amountPaid ?? 0;
  const balance = Math.max(0, sale - paid);
  const isCash = order.paymentMethod === "CASH" || !order.paymentMethod;
  const canComplete = canCompleteOrder(order);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${isDragging ? "opacity-90 shadow-lg ring-2 ring-emerald-400" : ""} cursor-grab active:cursor-grabbing`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2 mb-2 pointer-events-none">
        <span className="font-mono text-sm font-semibold text-slate-900">#{order.id}</span>
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <OrderStatusSelect
            orderId={order.id}
            currentStatus={order.status}
            canComplete={canComplete}
            onUpdate={updateOrderStatus}
          />
        </div>
      </div>
      {(order.paymentMethod === "CASH" || order.mpesaReceiptNo) && (
        <p className="text-[10px] text-slate-500 mt-0.5">
          {order.paymentMethod === "CASH" ? "Cash" : `M-Pesa ${order.mpesaReceiptNo ?? ""}`}
        </p>
      )}
      {!canComplete && order.paymentMethod !== "CASH" && (
        <div className="pointer-events-auto mt-1" onClick={(e) => e.stopPropagation()}>
          <form action={setPaymentRef} className="flex gap-1">
            <input type="hidden" name="orderId" value={order.id} />
            <input
              type="text"
              name="paymentRef"
              placeholder="M-Pesa receipt no."
              className="flex-1 min-w-0 rounded border border-slate-300 px-1.5 py-1 text-xs"
            />
            <button type="submit" className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
              Save
            </button>
          </form>
        </div>
      )}
      <div className="pointer-events-none">
        {order.phone && <p className="text-xs text-slate-600 truncate">{order.phone}</p>}
        <a
          href={mapsUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-600 hover:underline truncate block mt-0.5 pointer-events-auto"
          title={formatAddress(order)}
          onClick={(e) => e.stopPropagation()}
        >
          {formatAddress(order) || "—"}
        </a>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <span className="text-slate-500">Sale</span>
        <span className="font-medium text-right">{fmt(sale)}</span>
        <span className="text-slate-500">Paid</span>
        <span className="font-medium text-right">{fmt(paid)}</span>
      </div>
      <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <form action={updateOrderCostTransport} className="mt-2 flex flex-wrap items-center gap-1">
          <input type="hidden" name="orderId" value={order.id} />
          <input
            type="number"
            name="costTotal"
            step="0.01"
            min="0"
            placeholder="Cost"
            defaultValue={order.costTotal ?? ""}
            className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs"
          />
          <input
            type="number"
            name="transportFee"
            step="0.01"
            min="0"
            placeholder="Trans"
            defaultValue={order.transportFee ?? ""}
            className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs"
          />
          <button type="submit" className="rounded px-1.5 py-1 text-slate-500 hover:bg-slate-100 text-xs" title="Save cost & transport">✓</button>
        </form>
      </div>
      <div className="mt-1 text-xs">
        <span className="text-slate-500">Profit </span>
        <span className={profit >= 0 ? "text-emerald-600 font-medium" : "text-red-600"}>{fmt(profit)}</span>
      </div>
      {isCash && balance > 0 && (
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <form action={recordCashPayment} className="mt-2 flex gap-1">
            <input type="hidden" name="orderId" value={order.id} />
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              placeholder="Amount"
              className="flex-1 min-w-0 rounded border border-slate-300 px-1.5 py-1 text-xs"
            />
            <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">Pay</button>
          </form>
        </div>
      )}
      {isCash && balance === 0 && paid > 0 && (
        <p className="mt-1 text-xs text-emerald-600 font-medium">✓ Paid</p>
      )}
    </div>
  );
}

function DroppableColumn({
  column,
  orders,
  updateOrderStatus,
  updateOrderCostTransport,
  recordCashPayment,
  setPaymentRef,
}: {
  column: ColumnConfig;
  orders: OrderForBoard[];
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderCostTransport: (formData: FormData) => Promise<void>;
  recordCashPayment: (formData: FormData) => Promise<void>;
  setPaymentRef: (formData: FormData) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className={`rounded-xl border border-slate-200 overflow-hidden ${column.bg}`}>
      <div className={`px-3 py-2.5 border-b border-slate-200 ${column.headerBg}`}>
        <h2 className="text-sm font-semibold text-slate-800">{column.label}</h2>
        <p className="text-xs text-slate-500">{orders.length} orders</p>
      </div>
      <div
        ref={setNodeRef}
        className={`p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto transition-colors ${isOver ? "bg-emerald-50/50 ring-1 ring-emerald-200 ring-inset" : ""}`}
      >
        {orders.map((order) => (
          <DraggableCard
            key={order.id}
            order={order}
            updateOrderStatus={updateOrderStatus}
            updateOrderCostTransport={updateOrderCostTransport}
            recordCashPayment={recordCashPayment}
            setPaymentRef={setPaymentRef}
          />
        ))}
      </div>
    </div>
  );
}

export function OrderKanbanBoard({
  orders,
  columns,
  byStatus,
  updateOrderStatus,
  updateOrderCostTransport,
  recordCashPayment,
  setPaymentRef,
}: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const [dragError, setDragError] = useState<string | null>(null);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      setDragError(null);
      const { active, over } = event;
      if (!over || over.id === active.id) return;
      const orderId = Number(active.id);
      if (Number.isNaN(orderId)) return;
      const newStatus = String(over.id);
      const valid = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];
      if (!valid.includes(newStatus)) return;
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === newStatus) return;
      const result = await updateOrderStatus(orderId, newStatus);
      if (result?.ok) {
        router.refresh();
      } else if (result?.error) {
        setDragError(result.error);
      }
    },
    [orders, updateOrderStatus, router]
  );

  const activeOrder = activeId ? orders.find((o) => String(o.id) === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {dragError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {dragError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <DroppableColumn
            key={col.status}
            column={col}
            orders={byStatus[col.status] ?? []}
            updateOrderStatus={updateOrderStatus}
            updateOrderCostTransport={updateOrderCostTransport}
            recordCashPayment={recordCashPayment}
            setPaymentRef={setPaymentRef}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeOrder ? (
          <div className="rotate-2 scale-105 opacity-95 pointer-events-none">
            <DraggableCard
              order={activeOrder}
              updateOrderStatus={updateOrderStatus}
              updateOrderCostTransport={updateOrderCostTransport}
              recordCashPayment={recordCashPayment}
              setPaymentRef={setPaymentRef}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
