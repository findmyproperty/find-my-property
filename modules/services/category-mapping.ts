import type { Category } from "@/schema/category";
import { slugify } from "@/helpers";

export type ServiceCategoryOption = {
  value: string;
  label: string;
  description?: string;
};

function normalizeCategoryKey(value: string) {
  return slugify(value).replace(/-/g, "_");
}

function categoryMatchesValue(category: Category, values: string[]) {
  return (
    values.some((value) => normalizeCategoryKey(category.name) === normalizeCategoryKey(value)) ||
    values.some((value) => normalizeCategoryKey(category.slug) === normalizeCategoryKey(value))
  );
}

export function buildServiceOptions(
  staticOptions: readonly ServiceCategoryOption[],
  categories: Category[],
  service: NonNullable<Category["service"]>,
) {
  return staticOptions.map((option) => {
    const category = categories.find(
      (candidate) =>
        candidate.service === service &&
        candidate.isActive !== false &&
        categoryMatchesValue(candidate, [option.value, option.label]),
    );

    return {
      value: option.value,
      label: category?.name?.trim() || option.label,
      description: category?.description || option.description,
    };
  });
}

export function resolveVendorCategoryId(
  categories: Category[],
  service: NonNullable<Category["service"]>,
  value?: string | null,
  staticOptions?: readonly ServiceCategoryOption[],
) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;
  const optionLabel = staticOptions?.find((option) => option.value === normalizedValue)?.label;
  const aliases = [normalizedValue, optionLabel].filter(Boolean) as string[];

  const category = categories.find(
    (candidate) =>
      candidate.service === service &&
      candidate.isActive !== false &&
      (String(candidate.id) === normalizedValue || categoryMatchesValue(candidate, aliases)),
  );

  return category?.id ?? null;
}
