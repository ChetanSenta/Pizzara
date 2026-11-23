import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { checkoutLine, checkoutTotals } from '../utils/checkout';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

const CartSession = ({ children, storageKey }) => {
  const location = useLocation();
  const [items, setItems] = useState(() => {
    try {
      const savedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(savedItems) ? savedItems : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // The current cart remains usable when browser storage is unavailable.
    }
  }, [items, storageKey]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const addItem = (pizza) => {
    setItems((current) => {
      const key = pizza.id || pizza.name;
      const quantity = Math.min(10, pizza.quantity ?? 1);
      const existing = current.find((item) => (item.id || item.name) === key);
      if (existing) {
        return current.map((item) =>
          (item.id || item.name) === key ? { ...item, ...pizza, id: key, quantity: Math.min(10, item.quantity + quantity) } : item
        );
      }
      return [...current, { ...pizza, id: key, quantity }];
    });
    setOpen(true);
  };

  const updateQuantity = (id, quantity) => {
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => (item.id || item.name) !== id)
        : current.map((item) => (item.id || item.name) === id ? { ...item, quantity: Math.min(10, quantity) } : item)
    );
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => (item.id || item.name) !== id));
  };

  const { subtotal, deliveryFee, taxes, total } = useMemo(
    () => checkoutTotals(items.map(checkoutLine)),
    [items]
  );

  return (
    <CartContext.Provider value={{
      items, open, setOpen, addItem, updateQuantity, removeItem,
      subtotal, deliveryFee, taxes, total,
      clearCart: () => {
        setItems([]);
        setOpen(false);
      },
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = user?.id ? `pizzara-cart:user:${user.id}` : 'pizzara-cart:guest';
  return <CartSession key={storageKey} storageKey={storageKey}>{children}</CartSession>;
};
