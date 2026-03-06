import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function PlaceOrderPage({ userId }) {
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [place, setPlace] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const navigate = useNavigate();

  // 🧠 Fetch user cart
  useEffect(() => {
    axios
      .get(`http://localhost:8080/api/customers/cart/user/${userId}`)
      .then((res) => setCart(res.data))
      .catch(() => toast.error("Failed to load cart."));
  }, [userId]);

  // 🧾 Place Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast("Your cart is empty!");
      return;
    }

    setIsPlacing(true);
    try {
      const params = new URLSearchParams();
      if (deliveryAddress) params.append("deliveryAddress", deliveryAddress);
      if (phone) params.append("phone", phone);
      if (place) params.append("place", place);
      if (postalCode) params.append("postalCode", postalCode);

      await axios.post(
        `http://localhost:8080/api/orders/place/${userId}?${params.toString()}`
      );

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      toast.error(err.response?.data || "Error placing order");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-center">Checkout</h2>

      {cart.length === 0 ? (
        <p className="text-gray-400 text-center">Your cart is empty.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-700 mb-6">
            {cart.map((item, idx) => (
              <li key={idx} className="flex justify-between py-2">
                <span>{item.food.name}</span>
                <span>
                  ₹{item.food.price} × {item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="font-medium text-lg mb-2">Delivery Details</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Delivery Address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white outline-none"
            />
            <input
              type="text"
              placeholder="City / Place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white outline-none"
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white outline-none"
            />
            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white outline-none"
            />
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacing}
            className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-lg font-semibold transition-all"
          >
            {isPlacing ? "Placing Order..." : "Confirm Order"}
          </button>
        </>
      )}
    </div>
  );
}
