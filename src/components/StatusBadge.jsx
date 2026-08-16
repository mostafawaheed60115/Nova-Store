import React from "react";

/**
 * StatusBadge Component
 * Maps statuses consistently across Admin & Supplier Dashboards
 */
export default function StatusBadge({ status, type = "order" }) {
  if (!status) return <span className="status-badge status-badge--pending">N/A</span>;

  const s = status.toString().toLowerCase();

  let badgeClass = "status-badge--pending";
  let label = status.toString().replace(/_/g, " ");

  // Order & Sub-Order Statuses
  if (s === "pending") {
    badgeClass = "status-badge--pending";
    label = "Pending";
  } else if (s === "confirmed" || s === "accepted" || s === "accepted_by_supplier") {
    badgeClass = "status-badge--confirmed";
    label = "Accepted";
  } else if (s === "processing" || s === "ready_for_pickup") {
    badgeClass = "status-badge--processing";
    label = "Ready for Pickup";
  } else if (s === "shipped" || s === "picked_up" || s === "out_for_delivery") {
    badgeClass = "status-badge--shipped";
    label = s === "picked_up" ? "Picked Up" : s === "out_for_delivery" ? "Out for Delivery" : "Shipped";
  } else if (s === "delivered") {
    badgeClass = "status-badge--delivered";
    label = "Delivered";
  } else if (s === "cancelled" || s === "canceled") {
    badgeClass = "status-badge--cancelled";
    label = "Cancelled";
  } else if (s === "returned") {
    badgeClass = "status-badge--returned";
    label = "Returned";
  }

  // Financial & Payout Statuses
  if (type === "payout" || type === "cash") {
    if (s === "paid" || s === "remitted_to_platform") {
      badgeClass = "status-badge--delivered";
      label = s === "paid" ? "Paid to Supplier" : "Remitted to Platform";
    } else if (s === "eligible" || s === "collected_by_courier") {
      badgeClass = "status-badge--processing";
      label = s === "eligible" ? "Eligible for Payout" : "Collected by Courier";
    } else if (s === "pending") {
      badgeClass = "status-badge--pending";
      label = "Pending";
    }
  }

  // Product Active Statuses
  if (type === "product") {
    if (status === true || s === "active" || s === "true") {
      badgeClass = "status-badge--delivered";
      label = "Active";
    } else {
      badgeClass = "status-badge--cancelled";
      label = "Inactive";
    }
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="status-badge-dot" />
      <span>{label}</span>
    </span>
  );
}
