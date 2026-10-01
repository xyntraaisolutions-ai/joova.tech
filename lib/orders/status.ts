export function orderStatusLabel(status?: string | null, paymentStatus?: string | null) {
  if (paymentStatus && paymentStatus !== "paid") return "Waiting for payment";
  switch (status) {
    case "pending_payment":
      return "Waiting for payment";
    case "shipped":
      return "Shipped";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Preparing";
  }
}
