
export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedVehicleId?: string;
  active: boolean;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  assignedDriverId?: string;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface InspectionData {
  selfie?: string;
  shiftType?: 'start' | 'end';
  vehicleLocationImg?: string;
  frontImg?: string;
  rightImg?: string;
  leftImg?: string;
  backImg?: string;
  exteriorCleanliness?: 'Excellent' | 'Good' | 'Average' | 'Poor';
  exteriorBodyCheck?: 'Pass' | 'Fail';
  frontSeatImg?: string;
  backSeatImg?: string;
  trunkImg?: string;
  interiorCleanliness?: 'Excellent' | 'Good' | 'Average' | 'Poor';
  phoneHolderImg?: string;
  transponderImg?: string;
  leftFrontTireImg?: string;
  leftRearTireImg?: string;
  rightFrontTireImg?: string;
  rightRearTireImg?: string;
  odometer: string;
  brakes: 'Pass' | 'Fail';
  horn: 'Pass' | 'Fail';
  lights: 'Pass' | 'Fail';
  windshield: 'Pass' | 'Fail';
  wipers: 'Pass' | 'Fail';
  mirrors: 'Pass' | 'Fail';
  tirePressure: 'Pass' | 'Fail';
  batteryImg?: string;
  batteryLevel?: 'Full' | 'Half' | 'Low';
  windowsUpImg?: string;
  overallCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  signature?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface InspectionRecord {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  plateNumber: string;
  timestamp: number;
  status: 'complete' | 'incomplete';
  data: Partial<InspectionData>;
}
