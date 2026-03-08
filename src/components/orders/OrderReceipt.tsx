"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: OrderItem[];
    subtotal: number;
    discount_amount: number;
    delivery_fee: number;
    total: number;
    status: string;
    coupon_code: string | null;
    order_type: "dine_in" | "delivery" | "takeaway";
    table_number: string | null;
    number_of_people: number | null;
    area_name: string | null;
    nearest_landmark: string | null;
    car_details: string | null;
    created_at: string;
}

interface OrderReceiptProps {
    order: Order | null;
    restaurantName: string;
}

export function OrderReceipt({ order, restaurantName }: OrderReceiptProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!order || !mounted) return null;

    const formattedDate = format(new Date(order.created_at), "dd/MM/yyyy HH:mm");

    return (
        <div className="hidden print:block print:w-[80mm] print:m-0 print:p-4 text-black bg-white" dir="rtl">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>

            <div className="print-section font-mono text-sm space-y-4">
                {/* Header */}
                <div className="text-center space-y-1 mb-6">
                    <h1 className="text-2xl font-bold uppercase">{restaurantName}</h1>
                    <p className="text-sm">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs">{formattedDate}</p>
                </div>

                {/* Order Type & Customer Details */}
                <div className="border-y border-dashed border-black/30 py-3 space-y-1 mb-6">
                    <p className="font-bold text-center text-lg uppercase mb-2">
                        {order.order_type === 'dine_in' ? 'Dine In' :
                            order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                    </p>

                    {order.order_type === 'dine_in' && (
                        <p className="font-bold text-center text-xl">Table: {order.table_number}</p>
                    )}

                    {order.customer_name && <p><span className="font-bold">Name:</span> {order.customer_name}</p>}
                    {order.customer_phone && <p><span className="font-bold">Phone:</span> {order.customer_phone}</p>}

                    {order.order_type === 'delivery' && (
                        <>
                            <p><span className="font-bold">Area:</span> {order.area_name}</p>
                            {order.customer_address && <p><span className="font-bold">Address:</span> {order.customer_address}</p>}
                        </>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between border-b border-black pb-1 mb-2 font-bold">
                        <span>Item</span>
                        <span>Total</span>
                    </div>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                            <div className="flex-1 pr-4">
                                <p className="font-bold mb-0.5">{item.quantity}x {item.name}</p>
                            </div>
                            <span className="font-bold">{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-black/30 pt-3 space-y-1 mb-8">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{order.subtotal.toFixed(0)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Discount</span>
                            <span>-{order.discount_amount.toFixed(0)}</span>
                        </div>
                    )}
                    {order.order_type === 'delivery' && (
                        <div className="flex justify-between text-sm">
                            <span>Delivery Fee</span>
                            <span>{order.delivery_fee.toFixed(0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-black border-t border-black pt-2 mt-2">
                        <span>TOTAL</span>
                        <span>{order.total.toFixed(0)} IQD</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs space-y-1 mt-8 pt-4 border-t border-dashed border-black/30">
                    <p>Thank you for your order!</p>
                    <p>Powered by MenuPlus</p>
                </div>
            </div>
        </div>
    );
}
