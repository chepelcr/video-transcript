// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";
import { API_BASE_URL } from "@/lib/config";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch(`${API_BASE_URL}/api/paypal/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        console.log("PayPal Button: Starting SDK load process");
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => {
            console.log("PayPal SDK loaded successfully");
            initPayPal();
          };
          script.onerror = (error) => {
            console.error("PayPal SDK failed to load", error);
          };
          document.body.appendChild(script);
        } else {
          console.log("PayPal SDK already loaded");
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);
  const initPayPal = async () => {
    try {
      console.log("PayPal Button: Initializing PayPal");
      const baseUrl = API_BASE_URL;
      const apiUrl = `${baseUrl}/api/paypal/setup`;
      console.log("PayPal Button: Base URL:", baseUrl);
      console.log("PayPal Button: Fetching client token from:", apiUrl);
      console.log("PayPal Button: Environment check:", {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        isReplit: window.location.hostname.includes('replit.dev')
      });
      
      const clientToken: string = await fetch(apiUrl)
        .then((res) => {
          console.log("PayPal Button: Setup response status:", res.status);
          if (!res.ok) {
            throw new Error(`Setup request failed: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("PayPal Button: Received client token:", data.clientToken ? "✓" : "✗");
          if (!data.clientToken) {
            throw new Error("No client token received from server");
          }
          return data.clientToken;
        })
        .catch((error) => {
          console.error("PayPal Button: Failed to get client token:", error);
          throw error;
        });
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel,
              onError,
            });

      const onClick = async () => {
        try {
          console.log("PayPal Button: Button clicked, creating order...");
          const checkoutOptionsPromise = createOrder();
          console.log("PayPal Button: Starting PayPal checkout...");
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error("PayPal Button: Checkout error:", e);
        }
      };

      const paypalButton = document.getElementById("paypal-button");
      console.log("PayPal Button: Button element found:", !!paypalButton);

      if (paypalButton) {
        // Remove any existing listeners first
        paypalButton.removeEventListener("click", onClick);
        paypalButton.addEventListener("click", onClick);
        console.log("PayPal Button: Click handler attached successfully");
      } else {
        console.error("PayPal Button: Button element not found!");
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error("PayPal Button: Initialization failed:", e);
      // Show user-friendly error
      const paypalButton = document.getElementById("paypal-button");
      if (paypalButton) {
        paypalButton.innerHTML = '<div style="padding: 10px; background: #f44336; color: white; border-radius: 4px; text-align: center;">PayPal temporarily unavailable</div>';
      }
    }
  };

  return <paypal-button 
    id="paypal-button" 
    style={{
      display: 'block',
      width: '100%',
      minHeight: '40px',
      backgroundColor: '#0070ba',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: 'bold',
      textAlign: 'center' as const
    }}
  >
    Pay with PayPal
  </paypal-button>;
}
// <END_EXACT_CODE>
