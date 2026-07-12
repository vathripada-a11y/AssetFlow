import { AVAILABILITY_STATUS, getAvailabilityStatus } from '../utils/assetStatus';

export default function AssetStatusBadge({ status, quantity }) {
  const key = status || getAvailabilityStatus(quantity);
  const badge = AVAILABILITY_STATUS[key] || AVAILABILITY_STATUS.unavailable;

  return (
    <span className={`badge badge-${key}`}>
      <span>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  );
}
