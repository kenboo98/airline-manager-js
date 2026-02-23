export interface TicketPricing {
  economy: number
  business: number
  firstClass: number
}

export interface PassengerCount {
  economy: number
  business: number
  firstClass: number
}

export interface Flight {
  id: string
  flightNumber: string
  departureAirportCode: string
  arrivalAirportCode: string
  planeId: string
  departureTime: number
  arrivalTime: number
  ticketPricing: TicketPricing
  passengers: PassengerCount
  status: 'scheduled' | 'in-flight' | 'arrived' | 'cancelled'
  revenue: number
  cost: number
  distanceNm: number
}

export interface FlightSchedule {
  id: string
  flightNumber: string
  departureAirportCode: string
  arrivalAirportCode: string
  planeId: string
  departureTimeOfDay: number
  daysOfWeek: number[]
  ticketPricing: TicketPricing
  enabled: boolean
}
