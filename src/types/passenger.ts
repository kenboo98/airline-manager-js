export type PassengerType = 'business' | 'leisure' | 'ultraWealthy'

export interface Passenger {
  id: string
  type: PassengerType
  destinationCode: string
  maxPrice: number
  createdAt: number // totalMinutes when passenger was generated
}

export interface AirportPassengers {
  waiting: Passenger[] // Passengers waiting at this airport
}

export interface DestinationDemand {
  code: string
  name: string
  city: string
  passengerCount: number
  businessCount: number
  leisureCount: number
  ultraWealthyCount: number
}
