
import { STORAGE_KEYS, MOCK_USERS, MOCK_VEHICLES } from '../constants';
import { User, Vehicle, InspectionRecord } from '../types';

export const storage = {
  initialize: () => {
    if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) {
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(MOCK_VEHICLES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSPECTIONS)) {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify([]));
    }
  },

  getDrivers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS) || '[]'),
  saveDrivers: (drivers: User[]) => localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers)),

  getVehicles: (): Vehicle[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]'),
  saveVehicles: (vehicles: Vehicle[]) => localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles)),

  getInspections: (): InspectionRecord[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECTIONS) || '[]'),
  saveInspections: (inspections: InspectionRecord[]) => localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections)),

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getDraft: (): InspectionRecord | null => {
    const data = localStorage.getItem(STORAGE_KEYS.INCOMPLETE_INSPECTION);
    return data ? JSON.parse(data) : null;
  },
  saveDraft: (record: InspectionRecord | null) => {
    if (record) localStorage.setItem(STORAGE_KEYS.INCOMPLETE_INSPECTION, JSON.stringify(record));
    else localStorage.removeItem(STORAGE_KEYS.INCOMPLETE_INSPECTION);
  }
};
