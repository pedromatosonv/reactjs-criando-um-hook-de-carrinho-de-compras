import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(product => product.id == productId)

      if (product) {
        const response = await api.get(`stock/${productId}`)

        if (product.amount == response.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        const updatedCart = cart.map(product => {
          if (product.id === productId) {
            product.amount++
          }

          return product
        })

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

        setCart(updatedCart)

      } else {
        const response = await api.get(`products/${productId}`)
        const product = { ...response.data, amount: 1 }
        setCart(() => {
          const updatedCart = [ ...cart, product ]

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

          return updatedCart
        })
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(el => el.id === productId)

      if (productIndex == -1) {
        throw new Error();
      }

      setCart(() => {
        const updatedCart = [ ...cart ]
        updatedCart.splice(productIndex, 1)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

        return updatedCart
      })
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return
    }

    try {
      const response = await api.get(`stock/${productId}`)

      const productStockAmount = response.data.amount

      if (amount > productStockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = cart.map(product => {
        if (product.id === productId) {
          product.amount = amount
        }

        return product
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

      setCart(updatedCart)
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
