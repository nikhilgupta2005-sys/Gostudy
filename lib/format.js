export function formatPrice(product) {
  const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  if (product.pricingType === "range") {
    return `${inr(product.priceMin)} – ${inr(product.priceMax)}`;
  }
  return inr(product.priceMin);
}
