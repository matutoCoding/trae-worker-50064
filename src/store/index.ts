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
  RefundRequest
} from '@/types';
import { roomTypes as initRoomTypes } from '@/data/rooms';
import { rooms as initRooms, bookingOrders as initOrders } from '@/data/orders';
import { ferries as initFerries, shuttles as initShuttles } from '@/data/ferries';
import { activities as initActivities, activityBookings as initActivityBookings } from '@/data/activities';
import { diningBookings as initDiningBookings } from '@/data/dining';
import { refundRequests as initRefundRequests } from '@/data/stats';

const STORAGE_KEY = 'island_homestay_store_v1';

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

  // 初始化
  initStore: () => void;

  // 房态预订
  createBooking: (order: Omit<BookingOrder, 'id' | 'orderNo' | 'status' | 'createTime'>) => BookingOrder;
  updateRoomTypeAvailable: (roomTypeId: string, delta: number) => void;
  getNextOrderNo: () => string;

  // 房间管理
  updateRoomStatus: (roomId: string, status: Room['status'], guestInfo?: Partial<Room>) => void;
  batchCleanRooms: (roomIds: string[]) => void;
  assignRoomToOrder: (orderId: string, roomId: string) => void;

  // 船班接驳
  bookFerry: (ferryId: string, seats: number) => boolean;
  bookShuttle: (shuttleId: string, seats: number) => boolean;
  addShuttleBooking: (booking: { ferryId: string; ferryName: string; guestName: string; guestPhone: string }) => void;

  // 活动预约
  bookActivity: (booking: Omit<ActivityBooking, 'id' | 'status' | 'bookingTime'>) => boolean;

  // 餐饮预订
  createDiningBooking: (booking: Omit<DiningBooking, 'id' | 'orderNo' | 'status'>) => DiningBooking;

  // 退订处理
  approveRefund: (id: string, remark?: string) => void;
  rejectRefund: (id: string, remark?: string) => void;
  confirmRefund: (id: string) => void;
  addRefundRequest: (request: Omit<RefundRequest, 'id' | 'status' | 'createTime'>) => RefundRequest;

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

  initStore: () => {
    const { hydrate } = get();
    hydrate();
  },

  getNextOrderNo: () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const { orders } = get();
    const todayOrders = orders.filter(o => o.orderNo.startsWith(`BK${dateStr}`));
    const seq = String(todayOrders.length + 1).padStart(3, '0');
    return `BK${dateStr}${seq}`;
  },

  createBooking: (orderData) => {
    const { getNextOrderNo, persist } = get();
    const orderNo = getNextOrderNo();
    const newOrder: BookingOrder = {
      ...orderData,
      id: generateId(),
      orderNo,
      status: 'confirmed',
      createTime: new Date().toLocaleString('zh-CN')
    };

    set(state => ({
      orders: [...state.orders, newOrder]
    }));

    // 扣减库存
    get().updateRoomTypeAvailable(orderData.roomTypeId, -1);

    persist();
    console.log('[Store] 创建预订订单:', newOrder);
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
    console.log('[Store] 更新房间状态:', roomId, status);
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
    console.log('[Store] 批量清洁房间:', roomIds);
  },

  assignRoomToOrder: (orderId, roomId) => {
    const { rooms, updateRoomStatus } = get();
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, roomNumber: room.roomNumber, status: 'checkedIn' }
            : o
        )
      }));
      updateRoomStatus(roomId, 'occupied');
      get().persist();
    }
  },

  bookFerry: (ferryId, seats) => {
    const { ferries, persist } = get();
    const ferry = ferries.find(f => f.id === ferryId);
    if (!ferry || ferry.status === 'cancelled' || ferry.availableSeats < seats) {
      console.log('[Store] 船班预订失败:', ferryId, seats);
      return false;
    }

    set(state => ({
      ferries: state.ferries.map(f =>
        f.id === ferryId
          ? { ...f, availableSeats: f.availableSeats - seats }
          : f
      )
    }));
    persist();
    console.log('[Store] 船班预订成功:', ferryId, seats);
    return true;
  },

  bookShuttle: (shuttleId, seats) => {
    const { shuttles, persist } = get();
    const shuttle = shuttles.find(s => s.id === shuttleId);
    if (!shuttle || shuttle.bookedCount + seats > shuttle.capacity) {
      console.log('[Store] 接驳预约失败:', shuttleId, seats);
      return false;
    }

    set(state => ({
      shuttles: state.shuttles.map(s =>
        s.id === shuttleId
          ? { ...s, bookedCount: s.bookedCount + seats }
          : s
      )
    }));
    persist();
    console.log('[Store] 接驳预约成功:', shuttleId, seats);
    return true;
  },

  addShuttleBooking: (booking) => {
    console.log('[Store] 添加接驳预订记录:', booking);
    get().persist();
  },

  bookActivity: (bookingData) => {
    const { activities, activityBookings, persist } = get();
    const activity = activities.find(a => a.id === bookingData.activityId);
    if (!activity) return false;

    const remaining = activity.maxParticipants - activity.currentParticipants;
    if (remaining < bookingData.participants) {
      console.log('[Store] 活动预约失败，名额不足:', bookingData);
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
    console.log('[Store] 活动预约成功:', newBooking);
    return true;
  },

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
      id: generateId(),
      orderNo,
      status: 'confirmed'
    };

    set(state => ({
      diningBookings: [...state.diningBookings, newBooking]
    }));

    persist();
    console.log('[Store] 餐饮预订成功:', newBooking);
    return newBooking;
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
    get().persist();
    console.log('[Store] 退订申请已批准:', id);
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
    get().persist();
    console.log('[Store] 退订申请已拒绝:', id);
  },

  confirmRefund: (id) => {
    const { refundRequests, updateRoomTypeAvailable, orders } = get();
    const request = refundRequests.find(r => r.id === id);
    
    if (request && request.orderType === 'room') {
      const order = orders.find(o => o.id === request.orderId);
      if (order) {
        // 退款后恢复库存
        updateRoomTypeAvailable(order.roomTypeId, 1);
        // 更新订单状态
        set(state => ({
          orders: state.orders.map(o =>
            o.id === request.orderId
              ? { ...o, status: 'refunded' }
              : o
          )
        }));
      }
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
    get().persist();
    console.log('[Store] 退款已完成:', id);
  },

  addRefundRequest: (requestData) => {
    const { persist } = get();
    const newRequest: RefundRequest = {
      ...requestData,
      id: generateId(),
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN')
    };

    set(state => ({
      refundRequests: [...state.refundRequests, newRequest]
    }));

    persist();
    console.log('[Store] 添加退订申请:', newRequest);
    return newRequest;
  },

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
      refundRequests: state.refundRequests
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
          refundRequests: data.refundRequests || initRefundRequests
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
      refundRequests: initRefundRequests
    });
    console.log('[Store] 已重置为初始状态');
  }
}));
