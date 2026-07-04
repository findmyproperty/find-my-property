import type { Category, CategoryCreate, CategoryUpdate } from "@/schema/category";
import { getStoredToken, request } from "@/end-points/http";

export const categories = {
  async getCategories(): Promise<Category[]> {
    return request<Category[]>("/categories", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async createCategory(input: CategoryCreate): Promise<Category> {
    const payload = { ...input };
    return request<Category>("/categories", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(id: number, input: CategoryUpdate): Promise<Category> {
    return request<Category>(`/categories/${id}`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async deleteCategory(id: number): Promise<void> {
    return request<void>(`/categories/${id}`, {
      method: "DELETE",
      token: getStoredToken(),
    });
  },
};
