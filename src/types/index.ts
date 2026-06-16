// 每日房价库存
export interface DailyRate {
  date: string;
  price: number;
  available: number;
}

// 房型
export interface RoomType {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  capacity: number;
  bedType: string;
  size: number;
  window: boolean;
  balcony: boolean;
  seaView: boolean;
  amenities: string[];
  image: string;
  totalCount: number;
  availableCount: number;
  isPeakSeason: boolean;
  dailyRates: DailyRate[];
}

// 房间
export interface Room {
  id: string;
  roomNumber: string;
  typeId: string;
  typeName: string;
  floor: number;
  status: 'clean' | 'dirty' | 'occupied' | 'maintenance';
  checkInDate?: string;
  checkOutDate?: string;
  guestName?: string;
  guestPhone?: string;
  deposit: number;
}

// 每日房价明细
export interface DailyPriceDetail {
  date: string;
  price: number;
}

// 订单
export interface BookingOrder {
  id: string;
  orderNo: string;
  roomTypeId: string;
  roomTypeName: string;
  roomNumber?: string;
  guestName: string;
  guestPhone: string;
  idCard?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  price: number;
  totalAmount: number;
  deposit: number;
  dailyPrices: DailyPriceDetail[];
  assignedRoomId?: string;
  status: 'pending' | 'confirmed' | 'checkedIn' | 'checkedOut' | 'cancelled' | 'refunding' | 'refunded';
  createTime: string;
  remark?: string;
}

// 船班
export interface Ferry {
  id: string;
  route: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  date: string;
  status: 'normal' | 'delayed' | 'cancelled';
}

// 接驳安排
export interface Shuttle {
  id: string;
  ferryId: string;
  ferryName: string;
  pickupTime: string;
  pickupPoint: string;
  dropoffPoint: string;
  capacity: number;
  bookedCount: number;
  driver?: string;
  vehicle?: string;
}

// 活动
export interface Activity {
  id: string;
  name: string;
  description: string;
  type: 'diving' | 'snorkeling' | 'fishing' | 'kayaking' | 'other';
  price: number;
  duration: string;
  maxParticipants: number;
  currentParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
  location: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  includes: string[];
}

// 活动预约
export interface ActivityBooking {
  id: string;
  activityId: string;
  activityName: string;
  guestName: string;
  guestPhone: string;
  participants: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'refunding' | 'refunded';
  bookingTime: string;
}

// 餐饮
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isRecommended: boolean;
  isSpicy?: boolean;
  isSeafood: boolean;
}

// 餐饮预订
export interface DiningBooking {
  id: string;
  orderNo: string;
  guestName: string;
  guestPhone: string;
  date: string;
  time: string;
  guestsCount: number;
  guests: number;
  tableNumber?: string;
  dishes: { dishId: string; dishName: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
  remark?: string;
  createTime?: string;
}

// 退订申请
export interface RefundRequest {
  id: string;
  orderId: string;
  orderNo: string;
  orderType: 'room' | 'activity' | 'dining';
  guestName: string;
  reason: string;
  reasonType: 'typhoon' | 'personal' | 'other';
  refundAmount: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  createTime: string;
  handleTime?: string;
  handleRemark?: string;
}

// 统计数据
export interface StatsData {
  todayRevenue: number;
  monthRevenue: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  monthOrders: number;
  avgRating: number;
  totalReviews: number;
}

// 每日收益
export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
  occupancyRate: number;
}

// 评价
export interface Review {
  id: string;
  guestName: string;
  avatar: string;
  rating: number;
  content: string;
  images?: string[];
  createTime: string;
  roomTypeName?: string;
  reply?: string;
}

// 服务入口
export interface ServiceEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  pagePath: string;
  color: string;
  bgColor: string;
}

// 船班接驳预约记录
export interface ShuttleBooking {
  id: string;
  ferryId?: string;
  shuttleId?: string;
  ferryName: string;
  guestName: string;
  guestPhone: string;
  passengers: number;
  bookingTime: string;
  type: 'ferry' | 'shuttle' | 'both';
  totalPrice?: number;
  date?: string;
}
