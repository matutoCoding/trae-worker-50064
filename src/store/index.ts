import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  Room,
  RoomType,
  BookingOrder,
  Ferry,
  Shuttle,
  Activity,
  ActivityBooking,
  DiningBooking,
  RefundRequest,
  ShuttleBooking,
  DailyPriceDetail
} from '@/types';
import { roomTypes as initRoomTypes } from '@/data/rooms';
import { rooms as initRooms, bookingOrders as initOrders } from '@/data/orders';
import { ferries as initFerries, shuttles as initShuttles } from '@/data/ferries';
import { activities as initActivities, activityBookings as initActivityBookings } from '@/data/activities';
import { diningBookings as initDiningBookings } from '@/data/dining';
import { refundRequests as initRefundRequests } from '@/data/stats';
import { formatDate, getDateRange } from '@/utils';

const STORAGE_KEY = 'island_homestay_store_v2';

interface AppState {
  // 数据
  roomTypes: RoomType[];
  rooms: Room[];
  orders: BookingOrder[];
  ferries: Ferry[];
  shuttles: Shuttle[];
  activities: Activity[];
  activityBookings: ActivityBooking[];
  diningBookings: DiningBooking[];
  refundRequests: RefundRequest[];
  shuttleBookings: ShuttleBooking[];

  // 初始化
  initStore: () => void;

  // 日期库存工具
  getDailyRate: (roomTypeId: string, date: string) => number;
  getDailyAvailable: (roomTypeId: string, date: string) => number;
  checkRoomAvailability: (roomTypeId: string, checkIn: string, checkOut: string) => { available: boolean; dailyPrices: DailyPriceDetail[]; totalPrice: number };
  deductDailyInventory: (roomTypeId: string, checkIn: string, checkOut: string) => boolean;
  restoreDailyInventory: (roomTypeId: string, checkIn: string, checkOut: string) => boolean;

  // 房态预订
  createBooking: (order: Omit<BookingOrder, 'id' | 'orderNo' | 'status' | 'createTime' | 'dailyPrices' | 'nights'> & { checkInDate: string; checkOutDate: string; roomTypeId: string }) => BookingOrder | null;
  updateRoomTypeAvailable: (roomTypeId: string, delta: number) => void;
  getNextOrderNo: () => string;

  // 房间管理 - 排房视图
  assignRoomToOrder: (orderId: string, roomId: string) => boolean;
  updateRoomStatus: (roomId: string, status: Room['status'], guestInfo?: Partial<Room>) => void;
  batchCleanRooms: (roomIds: string[]) => void;
  getPendingOrders: () => BookingOrder[];

  // 船班接驳
  bookFerryAndShuttle: (data: {
    ferryId?: string;
    shuttleId?: string;
    ferryName: string;
    guestName: string;
    guestPhone: string;
    passengers: number;
    type: 'ferry' | 'shuttle' | 'both';
    date?: string;
  }) => boolean;
  getShuttleBookings: () => ShuttleBooking[];

  // 活动预约
  bookActivity: (booking: Omit<ActivityBooking, 'id' | 'status' | 'bookingTime'>) => boolean;
  cancelActivityBooking: (bookingId: string) => boolean;

  // 餐饮预订
  createDiningBooking: (booking: Omit<DiningBooking, 'id' | 'orderNo' | 'status' | 'createTime'>) => DiningBooking | null;
  getDiningRevenue: () => number;

  // 退订处理 - 多类型支持
  addRefundRequest: (data: {
    orderType: 'room' | 'activity' | 'dining';
    orderId: string;
    orderNo: string;
    guestName: string;
    reason: string;
    reasonType: 'typhoon' | 'personal' | 'other';
    refundAmount: number;
    totalAmount: number;
  }) => RefundRequest;
  approveRefund: (id: string, remark?: string) => void;
  rejectRefund: (id: string, remark?: string) => void;
  confirmRefund: (id: string) => void;

  // 持久化
  persist: () => void;
  hydrate: () => void;
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useAppStore = create<AppState>((set, get) => ({
  roomTypes: initRoomTypes,
  rooms: initRooms,
  orders: initOrders,
  ferries: initFerries,
  shuttles: initShuttles,
  activities: initActivities,
  activityBookings: initActivityBookings,
  diningBookings: initDiningBookings,
  refundRequests: initRefundRequests,
  shuttleBookings: [],

  initStore: () => {
    const { hydrate } = get();
    hydrate();
  },

  // ====== 日期库存相关 ======
  getDailyRate: (roomTypeId, date) => {
    const rt = get().roomTypes.find(r => r.id === roomTypeId);
    if (!rt) return 0;
    const rate = rt.dailyRates.find(d => d.date === date);
    return rate ? rate.price : rt.price;
  },

  getDailyAvailable: (roomTypeId, date) => {
    const rt = get().roomTypes.find(r => r.id === roomTypeId);
    if (!rt) return 0;
    const rate = rt.dailyRates.find(d => d.date === date);
    return rate ? rate.available : rt.availableCount;
  },

  checkRoomAvailability: (roomTypeId, checkIn, checkOut) => {
    const dates = getDateRange(checkIn, checkOut);
    const rt = get().roomTypes.find(r => r.id === roomTypeId);
    if (!rt || dates.length === 0) return { available: false, dailyPrices: [], totalPrice: 0 };

    let available = true;
    const dailyPrices: DailyPriceDetail[] = [];
    let totalPrice = 0;

    for (const date of dates) {
      const avail = get().getDailyAvailable(roomTypeId, date);
      const price = get().getDailyRate(roomTypeId, date);
      if (avail <= 0) available = false;
      dailyPrices.push({ date, price });
      totalPrice += price;
    }

    return { available, dailyPrices, totalPrice };
  },

  deductDailyInventory: (roomTypeId, checkIn, checkOut) => {
    const dates = getDateRange(checkIn, checkOut);
    const { available } = get().checkRoomAvailability(roomTypeId, checkIn, checkOut);
    if (!available) return false;

    set(state => ({
      roomTypes: state.roomTypes.map(rt => {
        if (rt.id !== roomTypeId) return rt;
        return {
          ...rt,
          availableCount: Math.max(0, rt.availableCount - 1),
          dailyRates: rt.dailyRates.map(dr =>
            dates.includes(dr.date)
              ? { ...dr, available: Math.max(0, dr.available - 1) }
              : dr
          )
        };
      })
    }));
    return true;
  },

  restoreDailyInventory: (roomTypeId, checkIn, checkOut) => {
    const dates = getDateRange(checkIn, checkOut);

    set(state => ({
      roomTypes: state.roomTypes.map(rt => {
        if (rt.id !== roomTypeId) return rt;
        return {
          ...rt,
          availableCount: Math.min(rt.totalCount, rt.availableCount + 1),
          dailyRates: rt.dailyRates.map(dr =>
            dates.includes(dr.date)
              ? { ...dr, available: Math.min(rt.totalCount, dr.available + 1) }
              : dr
          )
        };
      })
    }));
    return true;
  },

  // ====== 房态预订 ======
  getNextOrderNo: () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const { orders } = get();
    const todayOrders = orders.filter(o => o.orderNo.startsWith(`BK${dateStr}`));
    const seq = String(todayOrders.length + 1).padStart(3, '0');
    return `BK${dateStr}${seq}`;
  },

  createBooking: (orderData) => {
    const { getNextOrderNo, checkRoomAvailability, deductDailyInventory, persist } = get();
    const { checkInDate, checkOutDate, roomTypeId } = orderData;

    const { available, dailyPrices, totalPrice } = checkRoomAvailability(roomTypeId, checkInDate, checkOutDate);
    if (!available) {
      console.log('[Store] 库存不足，预订失败');
      return null;
    }

    const success = deductDailyInventory(roomTypeId, checkInDate, checkOutDate);
    if (!success) return null;

    const nights = dailyPrices.length;
    const orderNo = getNextOrderNo();
    const basePrice = dailyPrices.length > 0 ? dailyPrices[0].price : 0;

    const newOrder: BookingOrder = {
      ...orderData,
      id: generateId(),
      orderNo,
      status: 'confirmed',
      createTime: new Date().toLocaleString('zh-CN'),
      nights,
      dailyPrices,
      price: basePrice,
      totalAmount: totalPrice
    };

    set(state => ({
      orders: [...state.orders, newOrder]
    }));

    persist();
    console.log('[Store] 创建预订订单:', newOrder.orderNo, totalPrice);
    return newOrder;
  },

  updateRoomTypeAvailable: (roomTypeId, delta) => {
    set(state => ({
      roomTypes: state.roomTypes.map(rt =>
        rt.id === roomTypeId
          ? { ...rt, availableCount: Math.max(0, rt.availableCount + delta) }
          : rt
      )
    }));
    get().persist();
  },

  // ====== 房间管理 - 排房视图 ======
  getPendingOrders: () => {
    const today = formatDate(new Date());
    return get().orders.filter(o =>
      (o.status === 'confirmed' || o.status === 'pending') &&
      o.checkInDate <= today && (!o.assignedRoomId)
    );
  },

  assignRoomToOrder: (orderId, roomId) => {
    const { rooms, orders, updateRoomStatus, persist } = get();
    const room = rooms.find(r => r.id === roomId);
    const order = orders.find(o => o.id === orderId);

    if (!room || !order) {
      console.log('[Store] 排房失败：房间或订单不存在');
      return false;
    }

    if (room.status !== 'clean') {
      console.log('[Store] 排房失败：房间非空净状态');
      return false;
    }

    set(state => ({
      orders: state.orders.map(o =>
        o.id === orderId
          ? {
              ...o,
              assignedRoomId: roomId,
              roomNumber: room.roomNumber,
              status: 'checkedIn'
            }
          : o
      )
    }));

    updateRoomStatus(roomId, 'occupied', {
      guestName: order.guestName,
      guestPhone: order.guestPhone,
      checkInDate: order.checkInDate,
      checkOutDate: order.checkOutDate
    });

    persist();
    console.log('[Store] 排房成功:', order.orderNo, '→', room.roomNumber);
    return true;
  },

  updateRoomStatus: (roomId, status, guestInfo) => {
    set(state => ({
      rooms: state.rooms.map(r =>
        r.id === roomId
          ? {
              ...r,
              status,
              ...(status === 'occupied'
                ? {
                    guestName: guestInfo?.guestName ?? r.guestName,
                    guestPhone: guestInfo?.guestPhone ?? r.guestPhone,
                    checkInDate: guestInfo?.checkInDate ?? r.checkInDate,
                    checkOutDate: guestInfo?.checkOutDate ?? r.checkOutDate
                  }
                : status === 'clean'
                ? {
                    guestName: undefined,
                    guestPhone: undefined,
                    checkInDate: undefined,
                    checkOutDate: undefined
                  }
                : {})
            }
          : r
      )
    }));
    get().persist();
  },

  batchCleanRooms: (roomIds) => {
    set(state => ({
      rooms: state.rooms.map(r =>
        roomIds.includes(r.id)
          ? {
              ...r,
              status: 'clean' as const,
              guestName: undefined,
              guestPhone: undefined,
              checkInDate: undefined,
              checkOutDate: undefined
            }
          : r
      )
    }));
    get().persist();
  },

  // ====== 船班接驳 ======
  bookFerryAndShuttle: (data) => {
    const { ferries, shuttles, shuttleBookings, persist } = get();
    const { ferryId, shuttleId, passengers, type } = data;

    if (type === 'ferry' || type === 'both') {
      if (!ferryId) return false;
      const ferry = ferries.find(f => f.id === ferryId);
      if (!ferry || ferry.status === 'cancelled' || ferry.availableSeats < passengers) {
        return false;
      }
    }

    if (type === 'shuttle' || type === 'both') {
      if (!shuttleId) return false;
      const shuttle = shuttles.find(s => s.id === shuttleId);
      if (!shuttle || shuttle.bookedCount + passengers > shuttle.capacity) {
        return false;
      }
    }

    if (ferryId && (type === 'ferry' || type === 'both')) {
      set(state => ({
        ferries: state.ferries.map(f =>
          f.id === ferryId
            ? { ...f, availableSeats: f.availableSeats - passengers }
            : f
        )
      }));
    }

    if (shuttleId && (type === 'shuttle' || type === 'both')) {
      set(state => ({
        shuttles: state.shuttles.map(s =>
          s.id === shuttleId
            ? { ...s, bookedCount: s.bookedCount + passengers }
            : s
        )
      }));
    }

    const booking: ShuttleBooking = {
      id: generateId(),
      ferryId,
      shuttleId,
      ferryName: data.ferryName,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      passengers,
      bookingTime: new Date().toLocaleString('zh-CN'),
      type,
      date: data.date
    };

    set(state => ({
      shuttleBookings: [...state.shuttleBookings, booking]
    }));

    persist();
    console.log('[Store] 接驳预约成功:', booking);
    return true;
  },

  getShuttleBookings: () => {
    return [...get().shuttleBookings].reverse();
  },

  // ====== 活动预约 ======
  bookActivity: (bookingData) => {
    const { activities, activityBookings, persist } = get();
    const activity = activities.find(a => a.id === bookingData.activityId);
    if (!activity) return false;

    const remaining = activity.maxParticipants - activity.currentParticipants;
    if (remaining < bookingData.participants) {
      return false;
    }

    const newBooking: ActivityBooking = {
      ...bookingData,
      id: generateId(),
      status: 'confirmed',
      bookingTime: new Date().toLocaleString('zh-CN')
    };

    set(state => ({
      activities: state.activities.map(a =>
        a.id === bookingData.activityId
          ? { ...a, currentParticipants: a.currentParticipants + bookingData.participants }
          : a
      ),
      activityBookings: [...state.activityBookings, newBooking]
    }));

    persist();
    return true;
  },

  cancelActivityBooking: (bookingId) => {
    const { activityBookings, activities, persist } = get();
    const booking = activityBookings.find(b => b.id === bookingId);
    if (!booking || booking.status === 'cancelled') return false;

    set(state => ({
      activityBookings: state.activityBookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ),
      activities: state.activities.map(a =>
        a.id === booking.activityId
          ? { ...a, currentParticipants: Math.max(0, a.currentParticipants - booking.participants) }
          : a
      )
    }));

    persist();
    return true;
  },

  // ====== 餐饮预订 ======
  createDiningBooking: (bookingData) => {
    const { persist } = get();
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const { diningBookings } = get();
    const todayBookings = diningBookings.filter(d => d.orderNo.startsWith(`DN${dateStr}`));
    const seq = String(todayBookings.length + 1).padStart(3, '0');
    const orderNo = `DN${dateStr}${seq}`;

    const newBooking: DiningBooking = {
      ...bookingData,
      guests: bookingData.guestsCount,
      id: generateId(),
      orderNo,
      status: 'confirmed',
      createTime: now.toLocaleString('zh-CN')
    };

    set(state => ({
      diningBookings: [...state.diningBookings, newBooking]
    }));

    persist();
    console.log('[Store] 餐饮预订成功:', newBooking.orderNo);
    return newBooking;
  },

  getDiningRevenue: () => {
    return get().diningBookings
      .filter(d => d.status === 'confirmed' || d.status === 'completed')
      .reduce((sum, d) => sum + d.totalAmount, 0);
  },

  // ====== 退订处理 - 多类型 ======
  addRefundRequest: (data) => {
    const { persist } = get();
    const newRequest: RefundRequest = {
      ...data,
      id: generateId(),
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN')
    };

    set(state => ({
      refundRequests: [...state.refundRequests, newRequest]
    }));

    persist();
    return newRequest;
  },

  approveRefund: (id, remark) => {
    set(state => ({
      refundRequests: state.refundRequests.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              handleTime: new Date().toLocaleString('zh-CN'),
              handleRemark: remark || '审核通过'
            }
          : r
      )
    }));

    const request = get().refundRequests.find(r => r.id === id);
    if (request) {
      if (request.orderType === 'room') {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === request.orderId ? { ...o, status: 'refunding' } : o
          )
        }));
      } else if (request.orderType === 'activity') {
        set(state => ({
          activityBookings: state.activityBookings.map(b =>
            b.id === request.orderId ? { ...b, status: 'refunding' } : b
          )
        }));
      } else if (request.orderType === 'dining') {
        set(state => ({
          diningBookings: state.diningBookings.map(d =>
            d.id === request.orderId ? { ...d, status: 'refunding' } : d
          )
        }));
      }
    }

    get().persist();
  },

  rejectRefund: (id, remark) => {
    set(state => ({
      refundRequests: state.refundRequests.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              handleTime: new Date().toLocaleString('zh-CN'),
              handleRemark: remark || '不符合退订条件'
            }
          : r
      )
    }));

    const request = get().refundRequests.find(r => r.id === id);
    if (request) {
      if (request.orderType === 'room') {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === request.orderId ? { ...o, status: 'confirmed' } : o
          )
        }));
      } else if (request.orderType === 'activity') {
        set(state => ({
          activityBookings: state.activityBookings.map(b =>
            b.id === request.orderId ? { ...b, status: 'confirmed' } : b
          )
        }));
      } else if (request.orderType === 'dining') {
        set(state => ({
          diningBookings: state.diningBookings.map(d =>
            d.id === request.orderId ? { ...d, status: 'confirmed' } : d
          )
        }));
      }
    }

    get().persist();
  },

  confirmRefund: (id) => {
    const { refundRequests, restoreDailyInventory, orders, activities, activityBookings, persist } = get();
    const request = refundRequests.find(r => r.id === id);
    if (!request) return;

    if (request.orderType === 'room') {
      const order = orders.find(o => o.id === request.orderId);
      if (order) {
        restoreDailyInventory(order.roomTypeId, order.checkInDate, order.checkOutDate);
        set(state => ({
          orders: state.orders.map(o =>
            o.id === request.orderId ? { ...o, status: 'refunded' } : o
          )
        }));
        if (order.assignedRoomId) {
          get().updateRoomStatus(order.assignedRoomId, 'dirty');
        }
      }
    } else if (request.orderType === 'activity') {
      const booking = activityBookings.find(b => b.id === request.orderId);
      if (booking) {
        set(state => ({
          activityBookings: state.activityBookings.map(b =>
            b.id === request.orderId ? { ...b, status: 'refunded' } : b
          ),
          activities: state.activities.map(a =>
            a.id === booking.activityId
              ? { ...a, currentParticipants: Math.max(0, a.currentParticipants - booking.participants) }
              : a
          )
        }));
      }
    } else if (request.orderType === 'dining') {
      set(state => ({
        diningBookings: state.diningBookings.map(d =>
          d.id === request.orderId ? { ...d, status: 'refunded' } : d
        )
      }));
    }

    set(state => ({
      refundRequests: state.refundRequests.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'refunded',
              handleTime: new Date().toLocaleString('zh-CN'),
              handleRemark: '退款已完成'
            }
          : r
      )
    }));

    persist();
  },

  // ====== 持久化 ======
  persist: () => {
    const state = get();
    const dataToPersist = {
      roomTypes: state.roomTypes,
      rooms: state.rooms,
      orders: state.orders,
      ferries: state.ferries,
      shuttles: state.shuttles,
      activities: state.activities,
      activityBookings: state.activityBookings,
      diningBookings: state.diningBookings,
      refundRequests: state.refundRequests,
      shuttleBookings: state.shuttleBookings
    };
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(dataToPersist));
    } catch (e) {
      console.error('[Store] 持久化失败:', e);
    }
  },

  hydrate: () => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          roomTypes: data.roomTypes || initRoomTypes,
          rooms: data.rooms || initRooms,
          orders: data.orders || initOrders,
          ferries: data.ferries || initFerries,
          shuttles: data.shuttles || initShuttles,
          activities: data.activities || initActivities,
          activityBookings: data.activityBookings || initActivityBookings,
          diningBookings: data.diningBookings || initDiningBookings,
          refundRequests: data.refundRequests || initRefundRequests,
          shuttleBookings: data.shuttleBookings || []
        });
        console.log('[Store] 从本地存储恢复状态');
      }
    } catch (e) {
      console.error('[Store] 恢复状态失败:', e);
    }
  },

  reset: () => {
    try {
      Taro.removeStorageSync(STORAGE_KEY);
    } catch (e) {
      console.error('[Store] 清除存储失败:', e);
    }
    set({
      roomTypes: initRoomTypes,
      rooms: initRooms,
      orders: initOrders,
      ferries: initFerries,
      shuttles: initShuttles,
      activities: initActivities,
      activityBookings: initActivityBookings,
      diningBookings: initDiningBookings,
      refundRequests: initRefundRequests,
      shuttleBookings: []
    });
  }
}));
