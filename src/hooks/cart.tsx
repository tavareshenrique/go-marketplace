import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const ASYNC_STORAGE_KEY = '@GoMarketplace:products';

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      // Retiro o produto que será alterado, retornando um novo array sem ele
      const filterProducts = products.filter(product => product.id !== id);
      // Busco o produto que terá a quantidade alterada
      const newProduct = products.find(product => product.id === id);
      // Seto o estado com o array novo e o produto com a nova quantidade
      if (newProduct) {
        newProduct.quantity += 1;

        setProducts([...filterProducts, newProduct]);
      }

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // Retiro o produto que será alterado retornando um novo array sem ele
      const filterProducts = products.filter(product => product.id !== id);
      // Busco o produto que terá a quantidade alterada
      const newProduct = products.find(product => product.id === id);
      // Seto o estado com o array novo e o produto novo
      if (newProduct) {
        // Se houver apenas uma unidade do produto, retiro do carrinho
        if (newProduct.quantity <= 1) {
          setProducts(filterProducts);
        } else {
          newProduct.quantity -= 1;

          setProducts([...filterProducts, newProduct]);
        }
      }

      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          ASYNC_STORAGE_KEY,
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

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
