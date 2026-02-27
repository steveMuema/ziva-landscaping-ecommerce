"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  paymentRefs: { value: string; amount: number | null }[];
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
  addPaymentRef: (formData: FormData) => Promise<void>;
};

function formatAddress(order: OrderForBoard) {
  if (order.location) return order.location;
  const parts = [order.address, order.apartment, order.city, order.state, order.postalCode, order.country].filter(Boolean);
  return parts.join(", ") || "—";
}

function mapsUrl(order: OrderForBoard) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(order))}`;
}

function totalDue(order: OrderForBoard): number {
  return order.subtotal + (order.transportFee ?? 0);
}

function canCompleteOrder(order: OrderForBoard): boolean {
  if (order.paymentRefs.length === 0) return false;
  const allHaveAmount = order.paymentRefs.every((r) => r.amount != null && r.amount > 0);
  const refsTotal = order.paymentRefs.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  return allHaveAmount && refsTotal >= totalDue(order);
}

function OrderCardContent({
  order,
  updateOrderStatus,
  addPaymentRef,
}: {
  order: OrderForBoard;
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  addPaymentRef: (formData: FormData) => Promise<void>;
}) {
  const transport = order.transportFee ?? 0;
  const sale = totalDue(order);
  const refsTotal = order.paymentRefs.reduce((s, r) => s + (r.amount ?? 0), 0);
  const paid = order.paymentRefs.length > 0 ? refsTotal : (order.amountPaid ?? 0);
  const balance = Math.max(0, sale - paid);
  const canComplete = canCompleteOrder(order);

  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2 pointer-events-none">
        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">#{order.id}</span>
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <OrderStatusSelect
            orderId={order.id}
            currentStatus={order.status}
            canComplete={canComplete}
            onUpdate={updateOrderStatus}
          />
        </div>
      </div>
      {order.paymentRefs.length > 0 && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 space-y-0.5">
          {order.paymentRefs.map((r, i) => (
            <div key={i} className="flex justify-between gap-1">
              <span className="truncate" title={r.value}>{r.value}</span>
              {r.amount != null && <span className="font-mono shrink-0">{fmt(r.amount)}</span>}
            </div>
          ))}
          {(() => {
            const refsTotal = order.paymentRefs.reduce((s, r) => s + (r.amount ?? 0), 0);
            const needMore = Math.max(0, totalDue(order) - refsTotal);
            return (
              <p className="text-[10px] pt-0.5 border-t border-slate-100 dark:border-slate-600">
                Refs total: {fmt(refsTotal)} {needMore > 0 ? `(need ${fmt(needMore)} more)` : "✓"}
              </p>
            );
          })()}
        </div>
      )}
      <div className="pointer-events-auto mt-1" onClick={(e) => e.stopPropagation()}>
        <form action={addPaymentRef} className="space-y-1">
          <div className="flex gap-1">
            <input type="hidden" name="orderId" value={order.id} />
            <input
              type="text"
              name="paymentRef"
              placeholder="Ref or receipt no."
              className="flex-1 min-w-0 rounded border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
              required
            />
            <input
              type="number"
              name="refAmount"
              step="0.01"
              min="0.01"
              required
              placeholder="Amount"
              className="w-20 rounded border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
            <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shrink-0">
              Add payment
            </button>
          </div>
        </form>
      </div>
      <div className="pointer-events-none">
        {order.phone && <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{order.phone}</p>}
        <a
          href={mapsUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-600 hover:underline truncate block mt-0.5 pointer-events-auto dark:text-emerald-400 dark:hover:text-emerald-300"
          title={formatAddress(order)}
          onClick={(e) => e.stopPropagation()}
        >
          {formatAddress(order) || "—"}
        </a>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-600 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400">Sale</span>
        <span className="font-medium text-right">{fmt(sale)}</span>
        {transport > 0 && (
          <>
            <span className="text-slate-500 dark:text-slate-400">Delivery</span>
            <span className="font-medium text-right">{fmt(transport)}</span>
          </>
        )}
        <span className="text-slate-500 dark:text-slate-400">Paid</span>
        <span className="font-medium text-right">{fmt(paid)}</span>
      </div>
      {balance === 0 && paid > 0 && (
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Paid</p>
      )}
    </>
  );
}

function StaticOrderCard({
  order,
  updateOrderStatus,
  addPaymentRef,
}: {
  order: OrderForBoard;
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  addPaymentRef: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-[var(--card-bg)]">
      <OrderCardContent order={order} updateOrderStatus={updateOrderStatus} addPaymentRef={addPaymentRef} />
    </div>
  );
}

function DraggableCard({
  order,
  updateOrderStatus,
  addPaymentRef,
  isDragging,
}: {
  order: OrderForBoard;
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  addPaymentRef: (formData: FormData) => Promise<void>;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(order.id),
    data: { order },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-600 dark:bg-[var(--card-bg)] ${isDragging ? "opacity-90 shadow-lg ring-2 ring-emerald-400" : ""} cursor-grab active:cursor-grabbing`}
      {...listeners}
      {...attributes}
    >
      <OrderCardContent order={order} updateOrderStatus={updateOrderStatus} addPaymentRef={addPaymentRef} />
    </div>
  );
}

function StaticColumn({
  column,
  orders,
  updateOrderStatus,
  addPaymentRef,
}: {
  column: ColumnConfig;
  orders: OrderForBoard[];
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  addPaymentRef: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 overflow-hidden dark:border-slate-600 dark:bg-[var(--card-bg)] ${column.bg}`}>
      <div className={`px-3 py-2.5 border-b border-slate-200 dark:border-slate-600 ${column.headerBg}`}>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{column.label}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{orders.length} orders</p>
      </div>
      <div className="p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
        {orders.map((order) => (
          <StaticOrderCard
            key={order.id}
            order={order}
            updateOrderStatus={updateOrderStatus}
            addPaymentRef={addPaymentRef}
          />
        ))}
      </div>
    </div>
  );
}

function DroppableColumn({
  column,
  orders,
  updateOrderStatus,
  addPaymentRef,
}: {
  column: ColumnConfig;
  orders: OrderForBoard[];
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
  addPaymentRef: (formData: FormData) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className={`rounded-xl border border-slate-200 overflow-hidden dark:border-slate-600 dark:bg-[var(--card-bg)] ${column.bg}`}>
      <div className={`px-3 py-2.5 border-b border-slate-200 dark:border-slate-600 ${column.headerBg}`}>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{column.label}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{orders.length} orders</p>
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
            addPaymentRef={addPaymentRef}
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
  addPaymentRef,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeColumns = Array.isArray(columns) && columns.length > 0 ? columns : [];
  const safeByStatus = byStatus && typeof byStatus === "object" ? byStatus : {};

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

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {safeColumns.map((col) => (
          <StaticColumn
            key={col.status}
            column={col}
            orders={(safeByStatus[col.status] as OrderForBoard[] | undefined) ?? []}
            updateOrderStatus={updateOrderStatus}
            addPaymentRef={addPaymentRef}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {dragError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {dragError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {safeColumns.map((col) => (
          <DroppableColumn
            key={col.status}
            column={col}
            orders={(safeByStatus[col.status] as OrderForBoard[] | undefined) ?? []}
            updateOrderStatus={updateOrderStatus}
            addPaymentRef={addPaymentRef}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeOrder ? (
          <div className="rotate-2 scale-105 opacity-95 pointer-events-none">
            <DraggableCard
              order={activeOrder}
              updateOrderStatus={updateOrderStatus}
              addPaymentRef={addPaymentRef}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
