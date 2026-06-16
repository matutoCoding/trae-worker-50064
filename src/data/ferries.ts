import type { Ferry, Shuttle } from '@/types';

export const ferries: Ferry[] = [
  {
    id: 'f1',
    route: '码头A - 海岛码头',
    departure: '市区码头A',
    arrival: '海岛码头',
    departureTime: '08:00',
    arrivalTime: '09:30',
    price: 120,
    totalSeats: 200,
    availableSeats: 86,
    date: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'f2',
    route: '码头A - 海岛码头',
    departure: '市区码头A',
    arrival: '海岛码头',
    departureTime: '10:30',
    arrivalTime: '12:00',
    price: 120,
    totalSeats: 200,
    availableSeats: 150,
    date: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'f3',
    route: '码头A - 海岛码头',
    departure: '市区码头A',
    arrival: '海岛码头',
    departureTime: '14:00',
    arrivalTime: '15:30',
    price: 120,
    totalSeats: 200,
    availableSeats: 180,
    date: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'f4',
    route: '码头B - 海岛码头',
    departure: '市区码头B',
    arrival: '海岛码头',
    departureTime: '09:00',
    arrivalTime: '10:15',
    price: 100,
    totalSeats: 150,
    availableSeats: 45,
    date: '2026-06-17',
    status: 'delayed'
  },
  {
    id: 'f5',
    route: '海岛码头 - 码头A',
    departure: '海岛码头',
    arrival: '市区码头A',
    departureTime: '07:30',
    arrivalTime: '09:00',
    price: 120,
    totalSeats: 200,
    availableSeats: 120,
    date: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'f6',
    route: '海岛码头 - 码头A',
    departure: '海岛码头',
    arrival: '市区码头A',
    departureTime: '16:00',
    arrivalTime: '17:30',
    price: 120,
    totalSeats: 200,
    availableSeats: 200,
    date: '2026-06-17',
    status: 'normal'
  },
  {
    id: 'f7',
    route: '码头A - 海岛码头',
    departure: '市区码头A',
    arrival: '海岛码头',
    departureTime: '08:00',
    arrivalTime: '09:30',
    price: 120,
    totalSeats: 200,
    availableSeats: 0,
    date: '2026-06-18',
    status: 'cancelled'
  }
];

export const shuttles: Shuttle[] = [
  {
    id: 's1',
    ferryId: 'f1',
    ferryName: '08:00 码头A出发',
    pickupTime: '09:45',
    pickupPoint: '海岛码头出口',
    dropoffPoint: '民宿大堂',
    capacity: 15,
    bookedCount: 8,
    driver: '张师傅',
    vehicle: '14座电瓶车'
  },
  {
    id: 's2',
    ferryId: 'f2',
    ferryName: '10:30 码头A出发',
    pickupTime: '12:15',
    pickupPoint: '海岛码头出口',
    dropoffPoint: '民宿大堂',
    capacity: 15,
    bookedCount: 3,
    driver: '李师傅',
    vehicle: '14座电瓶车'
  },
  {
    id: 's3',
    ferryId: 'f4',
    ferryName: '09:00 码头B出发',
    pickupTime: '10:30',
    pickupPoint: '海岛码头出口',
    dropoffPoint: '民宿大堂',
    capacity: 10,
    bookedCount: 6,
    driver: '王师傅',
    vehicle: '9座商务车'
  }
];

export const getFerriesByDate = (date: string) => {
  return ferries.filter(ferry => ferry.date === date);
};

export const getFerriesByRoute = (departure: string, arrival: string) => {
  return ferries.filter(ferry => ferry.departure === departure && ferry.arrival === arrival);
};
