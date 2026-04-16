export interface Characteristic {
  name: string;
  value: string;
  unit?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  imageUrl?: string;
  location?: string;
  characteristics: Characteristic[];
  order?: number;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Category[];
  parentId?: string;
  order?: number;
}
