export interface PlaneModel {
  id: string
  manufacturer: string
  name: string
  range: number
  speed: number
  defaultSeats: { economy: number; business: number; firstClass: number }
  minRunwayLength: number
  purchasePrice: number
  operatingCostPerNm: number
  fuelPerHour: number
}

export interface OwnedPlane {
  id: string
  modelId: string
  registration: string
  seats: { economy: number; business: number; firstClass: number }
  status: 'available' | 'in-flight' | 'maintenance'
  totalFlightHours: number
  currentFlightId: string | null
  currentAirportCode: string
}
