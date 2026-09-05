export const AVAILABILITY_STATUS = {
  available: {
    label: 'Available',
    icon: '🟢',
    textColor: '#155724',
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb'
  },
  low_stock: {
    label: 'Low Stock',
    icon: '🟡',
    textColor: '#856404',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba'
  },
  unavailable: {
    label: 'Unavailable',
    icon: '🔴',
    textColor: '#721c24',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb'
  }
};

export function getAvailabilityStatus(quantity) {
  const qty = Number(quantity ?? 0);
  if (qty > 5) return 'available';
  if (qty > 0) return 'low_stock';
  return 'unavailable';
}
