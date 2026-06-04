/** Product-type display labels (sale_items carry the enum; the UI shows these). */
export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  internet: 'Internet',
  tv: 'TV',
  home_phone: 'Home Phone',
  greenfield_internet: 'Greenfield Internet',
};

export const productTypeLabel = (type: string): string => PRODUCT_TYPE_LABEL[type] ?? type;
