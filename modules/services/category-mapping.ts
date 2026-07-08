import { useEffect } from "react";
import type { Category } from "@/schema/category";
import { slugify } from "@/helpers";

export type ServiceCategoryOption = {
  value: string;
  label: string;
  description?: string;
};

export const SERVICE_OPTIONS_LOADING_PLACEHOLDER = "Loading services…";
export const SERVICE_OPTIONS_UNAVAILABLE_PLACEHOLDER = "No services available";
export const SERVICE_OPTIONS_UNAVAILABLE_MESSAGE =
  "No services are available right now. Please check back later.";

function normalizeCategoryKey(value: string) {
  return slugify(value).replace(/-/g, "_");
}

function categoryMatchesValue(category: Category, values: string[]) {
  const slugKey = normalizeCategoryKey(category.slug);
  const nameKey = normalizeCategoryKey(category.name);

  return values.some((value) => {
    const key = normalizeCategoryKey(value);
    return (
      key === slugKey ||
      key === nameKey ||
      slugKey.startsWith(`${key}_`)
    );
  });
}

function getMappedCategories(
  categories: Category[],
  service: NonNullable<Category["service"]>,
) {
  return categories.filter(
    (category) => category.service === service && category.isActive !== false,
  );
}

function categoryToOption(
  category: Category,
  staticOptions?: readonly ServiceCategoryOption[],
): ServiceCategoryOption {
  const staticMatch = staticOptions?.find((option) =>
    categoryMatchesValue(category, [option.value, option.label]),
  );

  return {
    value: staticMatch?.value ?? normalizeCategoryKey(category.slug),
    label: category.name.trim(),
    description:
      category.description?.trim() ||
      staticMatch?.description ||
      undefined,
  };
}

/** Build dropdown options from admin category mappings only (no static fallback). */
export function buildServiceOptions(
  staticOptions: readonly ServiceCategoryOption[],
  categories: Category[],
  service: NonNullable<Category["service"]>,
) {
  return getMappedCategories(categories, service)
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((category) => categoryToOption(category, staticOptions));
}

export function resolveVendorCategoryId(
  categories: Category[],
  service: NonNullable<Category["service"]>,
  value?: string | null,
  staticOptions?: readonly ServiceCategoryOption[],
) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;

  const optionLabel = staticOptions?.find(
    (option) => option.value === normalizedValue,
  )?.label;
  const aliases = [normalizedValue, optionLabel].filter(Boolean) as string[];

  const category = categories.find(
    (candidate) =>
      candidate.service === service &&
      candidate.isActive !== false &&
      (String(candidate.id) === normalizedValue ||
        categoryMatchesValue(candidate, aliases)),
  );

  return category?.id ?? null;
}

export function getServiceOptionsFieldState(
  isLoading: boolean,
  options: ServiceCategoryOption[],
  defaultPlaceholder: string,
) {
  if (isLoading) {
    return {
      disabled: true,
      placeholder: SERVICE_OPTIONS_LOADING_PLACEHOLDER,
      emptyMessage: SERVICE_OPTIONS_UNAVAILABLE_MESSAGE,
    };
  }

  if (options.length === 0) {
    return {
      disabled: true,
      placeholder: SERVICE_OPTIONS_UNAVAILABLE_PLACEHOLDER,
      emptyMessage: SERVICE_OPTIONS_UNAVAILABLE_MESSAGE,
    };
  }

  return {
    disabled: false,
    placeholder: defaultPlaceholder,
    emptyMessage: "No results found.",
  };
}

export function isServiceFormBlocked(
  isLoading: boolean,
  options: ServiceCategoryOption[],
) {
  return isLoading || options.length === 0;
}

/** Keep form selection valid when admin adds/removes mapped categories. */
export function useSyncSelectedServiceOption(
  options: ServiceCategoryOption[],
  selectedValue: string | undefined,
  onSelect: (value: string) => void,
) {
  useEffect(() => {
    if (options.length === 0) return;

    const current = selectedValue?.trim();
    if (!current || !options.some((option) => option.value === current)) {
      onSelect(options[0].value);
    }
  }, [options, selectedValue, onSelect]);
}
