import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import type { Order } from "../../types/order";

// Fix default marker icons not loading in bundlers like Vite
const restaurantIcon = new L.DivIcon({
  html: `<div style="background:#e23744;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)">🍽️</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const deliveryIcon = new L.DivIcon({
  html: `<div style="background:#16a34a;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)">🛵</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const homeIcon = new L.DivIcon({
  html: `<div style="background:#2563eb;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)">🏠</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface DeliveryMapProps {
  order: Order;
}

export function DeliveryMap({ order }: DeliveryMapProps) {
  const restaurantPos: [number, number] = [
    order.deliveryPartner?.currentLat ?? order.deliveryAddress.latitude,
    order.deliveryPartner?.currentLng ?? order.deliveryAddress.longitude,
  ];
  const homePos: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  const [riderPos, setRiderPos] = useState<[number, number]>(restaurantPos);

  // Animate rider moving from restaurant to home once "out for delivery"
  useEffect(() => {
    if (order.status !== "out_for_delivery") {
      setRiderPos(restaurantPos);
      return;
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        setRiderPos(homePos);
        clearInterval(interval);
        return;
      }
      const lat = restaurantPos[0] + (homePos[0] - restaurantPos[0]) * progress;
      const lng = restaurantPos[1] + (homePos[1] - restaurantPos[1]) * progress;
      setRiderPos([lat, lng]);
    }, 400);

    return () => clearInterval(interval);
  }, [order.status]);

  const center: [number, number] = [
    (restaurantPos[0] + homePos[0]) / 2,
    (restaurantPos[1] + homePos[1]) / 2,
  ];

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={[restaurantPos, homePos]}
          pathOptions={{ color: "#e23744", dashArray: "6, 8", weight: 2 }}
        />

        <Marker position={restaurantPos} icon={restaurantIcon}>
          <Popup>{order.restaurantName}</Popup>
        </Marker>

        <Marker position={homePos} icon={homeIcon}>
          <Popup>Delivery address</Popup>
        </Marker>

        {(order.status === "out_for_delivery" || order.status === "delivered") && (
          <Marker position={riderPos} icon={deliveryIcon}>
            <Popup>{order.deliveryPartner?.name ?? "Delivery partner"}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}