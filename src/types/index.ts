export interface Category {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  subCategories: SubCategory[];
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

export interface Order {
  id: number;
  clientId: string;
  email: string;
  fullname: string;
  phone: string;
  company?: string;
  country: string;
  state: string;
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  subtotal: number;
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