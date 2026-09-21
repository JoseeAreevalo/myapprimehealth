import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/config';

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total, clearCart } = useCart();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async () => {
    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      const res = await axios.post(`${api.baseURL}${api.endpoints.checkoutSession}`, {
        items,
        shipping,
        userEmail: user?.email,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error || 'Checkout failed';
        const docs = err.response?.data?.docs;
        setCheckoutError(docs ? `${msg} → ${docs}` : msg);
      } else {
        setCheckoutError('Checkout failed. Please try again.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const FREE_SHIPPING_THRESHOLD = 100;
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className={`text-3xl font-bold mb-8 ${darkMode ? 'text-light' : 'text-gray-800'}`}
        >
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div
            className={`rounded-xl p-12 text-center shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <svg
              className="mx-auto h-20 w-20 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 7h12.8M7 13L5.4 5M17 13l1.4 7M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
            <p className={`text-xl font-medium mb-2 ${darkMode ? 'text-light' : 'text-gray-700'}`}>
              Your cart is empty
            </p>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add some products to get started!
            </p>
            <Link
              to="/products"
              className="inline-block bg-primary hover:bg-accent text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Items list */}
            <div className="flex-1 space-y-4">
              {/* Free shipping banner */}
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                    darkMode ? 'bg-gray-800 text-primary' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
                  </svg>
                  Add <span className="font-bold mx-1">${remaining.toFixed(2)}</span> more for FREE shipping!
                  {/* progress bar */}
                  <div className={`ml-auto w-24 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {subtotal >= FREE_SHIPPING_THRESHOLD && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-primary' : 'bg-primary/10 text-primary'}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  You've unlocked <span className="font-bold mx-1">FREE shipping!</span>
                </div>
              )}

              {items.map(item => {
                const effectivePrice = item.discount
                  ? item.price * (1 - item.discount)
                  : item.price;

                return (
                  <div
                    key={item.productId}
                    className={`flex items-center gap-4 rounded-xl p-4 shadow ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    {/* Product image */}
                    <div
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <img
                        src={`/${item.imgName}`}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          darkMode ? 'text-light' : 'text-gray-800'
                        }`}
                      >
                        {item.name}
                      </p>
                      {item.discount && (
                        <span className="text-xs text-gray-400 line-through mr-1">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-primary font-bold">
                        ${effectivePrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div
                      className={`flex items-center space-x-2 rounded-lg p-1 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded hover:text-primary transition-colors ${
                          darkMode ? 'text-light' : 'text-gray-700'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span
                        className={`w-6 text-center font-medium ${
                          darkMode ? 'text-light' : 'text-gray-800'
                        }`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded hover:text-primary transition-colors ${
                          darkMode ? 'text-light' : 'text-gray-700'
                        }`}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="w-20 text-right">
                      <span
                        className={`font-semibold ${
                          darkMode ? 'text-light' : 'text-gray-800'
                        }`}
                      >
                        ${(effectivePrice * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {/* Clear cart */}
              <div className="flex justify-end">
                <button
                  onClick={clearCart}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                >
                  Clear cart
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:w-72">
              <div
                className={`rounded-xl p-6 shadow sticky top-24 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <h2
                  className={`text-lg font-bold mb-4 ${
                    darkMode ? 'text-light' : 'text-gray-800'
                  }`}
                >
                  Order Summary
                </h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Subtotal
                    </span>
                    <span className={`font-medium ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Shipping
                    </span>
                    {shipping === 0 ? (
                      <span className="font-medium text-primary">FREE</span>
                    ) : (
                      <span className={`font-medium ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        ${shipping.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`border-t pt-4 mb-6 ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between">
                    <span
                      className={`font-bold text-lg ${
                        darkMode ? 'text-light' : 'text-gray-800'
                      }`}
                    >
                      Total
                    </span>
                    <span className="font-bold text-lg text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-primary hover:bg-accent disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Checkout with Stripe
                    </>
                  )}
                </button>
                {checkoutError && (
                  <p className="text-red-500 text-xs mt-2 text-center">{checkoutError}</p>
                )}

                <Link
                  to="/products"
                  className={`block text-center mt-3 text-sm ${
                    darkMode
                      ? 'text-gray-400 hover:text-primary'
                      : 'text-gray-500 hover:text-primary'
                  } transition-colors`}
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
