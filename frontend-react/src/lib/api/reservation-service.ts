import { apiDelete, apiGet, apiPost, apiPut } from "../api-client";

// --- INTERFACES ---
export interface CarDetailsForReservation {
  make: string;
  model: string;
  licensePlate: string;
  imageUrl?: string;
  vin?: string;
  status?: "available" | "rented" | "maintenance" | "out_of_service";
}

export interface ClientDetailsForReservation {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface UserDetailsForReservation {
  username?: string;
  fullName?: string;
}

export interface PaymentDetails {
  amountPaid: number;
  remainingBalance: number;
  transactionDate?: string | null;
}

export type ReservationStatus =
  | "pending_confirmation"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled_by_client"
  | "cancelled_by_agency"
  | "no_show";

export interface Reservation {
  id: string;
  reservationNumber: string;
  carId: string;
  carDetails?: CarDetailsForReservation | null;
  clientId: string;
  clientDetails?: ClientDetailsForReservation | null;
  startDate: string;
  endDate: string;
  actualPickupDate?: string | null;
  actualReturnDate?: string | null;
  status: ReservationStatus;
  estimatedTotalCost: number;
  finalTotalCost?: number | null;
  notes?: string;
  reservationDate: string;
  paymentDetails?: PaymentDetails;
  createdBy?: string;
  createdByUser?: UserDetailsForReservation | null;
  lastModifiedAt: string;
  lastModifiedBy?: string;
  lastModifiedByUser?: UserDetailsForReservation | null;
}

export interface ReservationCreateInput {
  carId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  estimatedTotalCost: number;
  status?: ReservationStatus;
  notes?: string;
  paymentDetails?: {
    amountPaid?: number;
    transactionDate?: string;
  };
}

export interface ReservationUpdateInput extends Partial<Omit<ReservationCreateInput, 'status'>> {
  estimatedTotalCost?: number;
}

export interface ReservationStatusUpdateInput {
  status: ReservationStatus;
  finalTotalCost?: number;
}

// --- FONCTIONS API ---
export async function getReservations(): Promise<Reservation[]> {
  return apiGet<Reservation[]>("/reservations");
}

export async function getReservation(id: string): Promise<Reservation> {
  return apiGet<Reservation>(`/reservations/${id}`);
}

export async function createReservation(reservationData: ReservationCreateInput): Promise<Reservation> {
  return apiPost<Reservation>("/reservations", reservationData);
}

export async function updateReservation(id: string, reservationData: ReservationUpdateInput): Promise<Reservation> {
  return apiPut<Reservation>(`/reservations/${id}`, reservationData);
}

export async function deleteReservation(id: string): Promise<void> {
  return apiDelete<void>(`/reservations/${id}`);
}

export async function updateReservationStatus(id: string, statusUpdateData: ReservationStatusUpdateInput): Promise<Reservation> {
  return apiPut<Reservation>(`/reservations/${id}/status`, statusUpdateData);
}
