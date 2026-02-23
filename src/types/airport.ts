export interface Airport {
  code: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  operatingHours: { open: number; close: number }
  demand: { business: number; leisure: number; firstClass: number }
  runwayLength: number
  landingFee: number
}
