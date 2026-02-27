export interface Category {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isAgriculture?: boolean;
  subCategories: SubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = "MPESA" | "CASH" | "PAY_ON_DELIVERY";

export interface Order {
  id: number;
  clientId: string;
  phone: string;
  location: string;
  email?: string | null;
  fullname?: string | null;
  company?: string | null;
  country?: string | null;
  state?: string | null;
  address?: string | null;
  apartment?: string | null;
  city?: string | null;
  postalCode?: string | null;
  subtotal: number;
  /** Delivery / transport fee (KSH). Set at checkout from site settings. */
  transportFee?: number | null;
  currency?: string;
  paymentMethod?: PaymentMethod | null;
  amountPaid?: number;
  /** Multiple payment refs (M-Pesa receipt numbers, cash receipt numbers, etc.) */
  orderPaymentRefs?: { value: string }[];
  status: string;
  orderItems: {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
    product: Product;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubCategory {
  id: number;
  name: string;
  description?: string | null;
  categoryId: number;
  imageUrl?: string | null;
  category: Category;
  products: Product[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  stock: number;
  subCategoryId: number;
  subCategory: SubCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Wishlist {
  id: number;
  clientId: string;
  productId: number;
  createdAt: Date;
}

export interface Cart {
  id: number;
  clientId: string;
  productId: number;
  quantity: number;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
    description: string | null;
    stock: number;
    subCategoryId: number;
  };
}

export interface Collection {
  id: number;
  image: string;
  category: string;
  alt: string;
  description: string;
}
