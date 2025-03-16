// services/orderService.ts
"use client"

import axios from 'axios';
import { Address } from '../../types/types';


import { PaymentMethod } from '../components/Payementmethod';



declare global {
    interface Window {
      Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
  }

  interface RazorpayOptions {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill: { contact: string };
    theme: { color: string };
    handler: (response: RazorpayResponse) => void;
  }
  
  interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
  interface RazorpayInstance {
    open: () => void;
  }
interface PaymentOrderResponse {
  id: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface ShiprocketResponse {
  success: boolean;
  data?: { 
    order_id?: string 
  };
  error?: string;
}

export const createRazorpayOrder = async (amount: number): Promise<string> => {
  try {
    const res = await axios.post<PaymentOrderResponse>("/api/createOrder", {
      amount: amount * 100,
    });
    
    if (!res.data || !res.data.id) {
      throw new Error("Failed to create payment order");
    }
    
    return res.data.id;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

export const verifyRazorpayPayment = async (
  response: RazorpayResponse
): Promise<boolean> => {
  try {
    const verifyRes = await axios.post<{ isOk: boolean }>("/api/verifyOrder", {
      orderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    });
    
    return verifyRes.data.isOk;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

export const createShiprocketOrder = async (
  userId: string,
  paymentMethod: PaymentMethod
): Promise<string> => {
  try {
    const shiprocketResponse = await axios.post<ShiprocketResponse>(
      "/api/ship",
      { userId, paymentMethod },
      { headers: { "Content-Type": "application/json" } }
    );

    if (!shiprocketResponse.data.success) {
      throw new Error(shiprocketResponse.data.error || "Failed to create order in Shiprocket");
    }

    return shiprocketResponse.data.data?.order_id || "";
  } catch (error) {
    console.error("Error creating Shiprocket order:", error);
    throw error;
  }
};

export const initializeRazorpayPayment = (
  key: string,
  orderId: string,
  amount: number,
  address: Address,
  onSuccess: (response: RazorpayResponse) => void
): void => {
  const paymentData = {
    key: key,
    order_id: orderId,
    amount: amount * 100,
    currency: "INR",
    name: "Your Store Name",
    description: "Order Payment",
    prefill: { contact: address.phone },
    theme: { color: "#3399cc" },
    handler: onSuccess,
    modal: {
      ondismiss: () => {
        // Actions to perform when the modal is dismissed
        alert('Payment was not completed. The page will now refresh for you to retry.');
        window.location.reload(); // Refresh the page
      }
    }
  };

  const payment = new (window ).Razorpay(paymentData);
  payment.open();
};