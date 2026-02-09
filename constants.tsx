
import { User, UserRole, Vehicle } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@fleet.com', role: UserRole.ADMIN, active: true },
  { id: 'u2', name: 'John Driver', email: 'john@fleet.com', role: UserRole.DRIVER, assignedVehicleId: 'v1', active: true },
  { id: 'u3', name: 'Jane Driver', email: 'jane@fleet.com', role: UserRole.DRIVER, assignedVehicleId: 'v2', active: true },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', plateNumber: 'ABC-1234', model: 'Toyota Camry 2023', assignedDriverId: 'u2', status: 'active' },
  { id: 'v2', plateNumber: 'XYZ-9876', model: 'Honda Civic 2022', assignedDriverId: 'u3', status: 'active' },
  { id: 'v3', plateNumber: 'FLE-5555', model: 'Ford F-150', assignedDriverId: undefined, status: 'active' },
];

export const STORAGE_KEYS = {
  CURRENT_USER: 'fleetcheck_user',
  VEHICLES: 'fleetcheck_vehicles',
  DRIVERS: 'fleetcheck_drivers',
  INSPECTIONS: 'fleetcheck_inspections',
  INCOMPLETE_INSPECTION: 'fleetcheck_current_draft'
};
