/* eslint-disable no-param-reassign */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storegedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (storegedProducts) {
        setProducts([...JSON.parse(storegedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async (product: Product) => {
    setProducts(items => {
      const foundItem = items.find(item => item.id === product.id);

      if (foundItem) {
        foundItem.quantity += 1;
        return [...items];
      }
      const prods = [...items, { ...product, quantity: 1 }];

      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(prods),
        error => {
          if (error) throw new Error('error');
        },
      );

      return prods;
    });
  }, []);

  const increment = useCallback(async id => {
    setProducts(items => {
      const prods = items.map(item => {
        if (item.id === id) item.quantity += 1;
        return item;
      });
      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(prods),
        error => {
          if (error) throw new Error('error');
        },
      );
      return prods;
    });
  }, []);

  const decrement = useCallback(async id => {
    setProducts(items => {
      const prods = items.reduce((acc, item) => {
        if (item.id !== id) return [...acc, item];

        if (item.quantity > 1) {
          return [...acc, { ...item, quantity: item.quantity - 1 }];
        }
        return [...acc];
      }, [] as Product[]);

      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(prods),
        error => {
          if (error) throw new Error('error');
        },
      );

      return prods;
    });
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
