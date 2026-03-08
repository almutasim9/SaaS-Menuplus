import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OrderItem } from '@/lib/types/database.types';

interface CartState {
    carts: Record<string, OrderItem[]>; // Keyed by restaurantSlug
    addItem: (slug: string, item: Omit<OrderItem, "quantity" | "cart_item_id"> & { cart_item_id?: string }) => void;
    removeItem: (slug: string, cart_item_id: string) => void;
    updateQuantity: (slug: string, cart_item_id: string, quantity: number) => void;
    clearCart: (slug: string) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            carts: {},

            addItem: (slug, item) => set((state) => {
                const currentCart = state.carts[slug] || [];
                const cartItemId = item.cart_item_id || `${item.id}-${item.variant?.name || 'base'}-${(item.addons || []).map(a => a.name).sort().join('-')}`;

                const existing = currentCart.find((i) => i.cart_item_id === cartItemId);

                let newCart;
                if (existing) {
                    newCart = currentCart.map((i) =>
                        i.cart_item_id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
                    );
                } else {
                    newCart = [...currentCart, { ...item, cart_item_id: cartItemId, quantity: 1 }];
                }

                return { carts: { ...state.carts, [slug]: newCart } };
            }),

            removeItem: (slug, cart_item_id) => set((state) => {
                const currentCart = state.carts[slug] || [];
                const newCart = currentCart.filter((i) => (i.cart_item_id || i.id) !== cart_item_id);
                return { carts: { ...state.carts, [slug]: newCart } };
            }),

            updateQuantity: (slug, cart_item_id, quantity) => set((state) => {
                const currentCart = state.carts[slug] || [];

                if (quantity <= 0) {
                    const newCart = currentCart.filter((i) => (i.cart_item_id || i.id) !== cart_item_id);
                    return { carts: { ...state.carts, [slug]: newCart } };
                }

                const newCart = currentCart.map((i) =>
                    (i.cart_item_id || i.id) === cart_item_id ? { ...i, quantity } : i
                );

                return { carts: { ...state.carts, [slug]: newCart } };
            }),

            clearCart: (slug) => set((state) => ({
                carts: { ...state.carts, [slug]: [] }
            }))
        }),
        {
            name: 'menuplus-carts-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

const EMPTY_ARRAY: OrderItem[] = [];

// Helper hooks for specific component access to avoid re-rendering on other cart changes
export const useCartItems = (slug: string) =>
    useCartStore((state) => state.carts[slug] || EMPTY_ARRAY);

export const useCartTotals = (slug: string) => {
    const items = useCartStore((state) => state.carts[slug] || EMPTY_ARRAY);
    return {
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
};
