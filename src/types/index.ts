export interface Category {
  id: number;
  name: string;
  imageUrl?: string | null;
  subCategories: SubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubCategory {
  id: number;
  name: string;
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
  carts: Cart[];
  wishlists: Wishlist[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Wishlist {
  id: number;
  userId: string;
  productId: number;
  product: Product;
  createdAt: Date;
}

export interface Cart {
  id: number;
  userId: string;
  productId: number;
  product: Product;
  quantity: number;
  createdAt: Date;
}

export interface Collection {
  id: number;
  image: string;
  category: string;
  alt: string;
  description: string;
}
