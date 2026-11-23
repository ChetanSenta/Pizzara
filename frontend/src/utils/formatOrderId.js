export const formatOrderId = (id) => {
  if (!id) return '';
  const value = String(id).replace(/^#/, '');
  return `#${value.slice(-8).toUpperCase()}`;
};
