"use client"
import { useParams } from "next/navigation";

export default function ProductPage() {
  const params = useParams();
  const { category, subcategory, id } = params;
  return <div>Product: {id} in {category}/{subcategory}</div>;
}