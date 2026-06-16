import type { BookingOrder, Room } from '@/types';

export const rooms: Room[] = [
  { id: 'r1', roomNumber: '101', typeId: '5', typeName: '经济标准间', floor: 1, status: 'clean', deposit: 200 },
  { id: 'r2', roomNumber: '102', typeId: '5', typeName: '经济标准间', floor: 1, status: 'occupied', checkInDate: '2026-06-15', checkOutDate: '2026-06-18', guestName: '张先生', guestPhone: '138****1234', deposit: 200 },
  { id: 'r3', roomNumber: '103', typeId: '5', typeName: '经济标准间', floor: 1, status: 'dirty', deposit: 200 },
  { id: 'r4', roomNumber: '201', typeId: '2', typeName: '海景标准双床房', floor: 2, status: 'clean', deposit: 300 },
  { id: 'r5', roomNumber: '202', typeId: '2', typeName: '海景标准双床房', floor: 2, status: 'occupied', checkInDate: '2026-06-16', checkOutDate: '2026-06-20', guestName: '李女士', guestPhone: '139****5678', deposit: 300 },
  { id: 'r6', roomNumber: '203', typeId: '2', typeName: '海景标准双床房', floor: 2, status: 'maintenance', deposit: 300 },
  { id: 'r7', roomNumber: '301', typeId: '1', typeName: '海景豪华大床房', floor: 3, status: 'clean', deposit: 500 },
  { id: 'r8', roomNumber: '302', typeId: '1', typeName: '海景豪华大床房', floor: 3, status: 'occupied', checkInDate: '2026-06-14', checkOutDate: '2026-06-17', guestName: '王先生', guestPhone: '137****9012', deposit: 500 },
  { id: 'r9', roomNumber: '303', typeId: '1', typeName: '海景豪华大床房', floor: 3, status: 'dirty', deposit: 500 },
  { id: 'r10', roomNumber: '401', typeId: '3', typeName: '园景家庭套房', floor: 4, status: 'clean', deposit: 800 },
  { id: 'r11', roomNumber: '402', typeId: '3', typeName: '园景家庭套房', floor: 4, status: 'occupied', checkInDate: '2026-06-13', checkOutDate: '2026-06-19', guestName: '陈女士一家', guestPhone: '136****3456', deposit: 800 },
  { id: 'r12', roomNumber: '501', typeId: '4', typeName: '海景蜜月套房', floor: 5, status: 'clean', deposit: 1000 },
  { id: 'r13', roomNumber: '502', typeId: '4', typeName: '海景蜜月套房', floor: 5, status: 'occupied', checkInDate: '2026-06-16', checkOutDate: '2026-06-21', guestName: '刘先生&刘太太', guestPhone: '135****7890', deposit: 1000 },
  { id: 'r14', roomNumber: '601', typeId: '6', typeName: '豪华海景三人间', floor: 6, status: 'occupied', checkInDate: '2026-06-15', checkOutDate: '2026-06-18', guestName: '赵先生一行', guestPhone: '134****2345', deposit: 500 },
  { id: 'r15', roomNumber: '602', typeId: '6', typeName: '豪华海景三人间', floor: 6, status: 'dirty', deposit: 500 }
];

export const bookingOrders: BookingOrder[] = [
  {
    id: 'o1',
    orderNo: 'BK20260616001',
    roomTypeId: '1',
    roomTypeName: '海景豪华大床房',
    roomNumber: '302',
    guestName: '王先生',
    guestPhone: '137****9012',
    checkInDate: '2026-06-14',
    checkOutDate: '2026-06-17',
    nights: 3,
    guestCount: 2,
    price: 688,
    totalAmount: 2064,
    deposit: 500,
    status: 'checkedIn',
    createTime: '2026-06-10 14:30:00'
  },
  {
    id: 'o2',
    orderNo: 'BK20260616002',
    roomTypeId: '2',
    roomTypeName: '海景标准双床房',
    roomNumber: '202',
    guestName: '李女士',
    guestPhone: '139****5678',
    checkInDate: '2026-06-16',
    checkOutDate: '2026-06-20',
    nights: 4,
    guestCount: 2,
    price: 588,
    totalAmount: 2352,
    deposit: 300,
    status: 'checkedIn',
    createTime: '2026-06-12 09:15:00'
  },
  {
    id: 'o3',
    orderNo: 'BK20260616003',
    roomTypeId: '4',
    roomTypeName: '海景蜜月套房',
    roomNumber: '502',
    guestName: '刘先生',
    guestPhone: '135****7890',
    checkInDate: '2026-06-16',
    checkOutDate: '2026-06-21',
    nights: 5,
    guestCount: 2,
    price: 1688,
    totalAmount: 8440,
    deposit: 1000,
    status: 'checkedIn',
    createTime: '2026-06-08 16:45:00',
    remark: '蜜月布置'
  },
  {
    id: 'o4',
    orderNo: 'BK20260616004',
    roomTypeId: '3',
    roomTypeName: '园景家庭套房',
    roomNumber: '402',
    guestName: '陈女士',
    guestPhone: '136****3456',
    checkInDate: '2026-06-13',
    checkOutDate: '2026-06-19',
    nights: 6,
    guestCount: 4,
    price: 1088,
    totalAmount: 6528,
    deposit: 800,
    status: 'checkedIn',
    createTime: '2026-06-01 10:20:00',
    remark: '需要婴儿床'
  },
  {
    id: 'o5',
    orderNo: 'BK20260616005',
    roomTypeId: '5',
    roomTypeName: '经济标准间',
    guestName: '周先生',
    guestPhone: '133****1111',
    checkInDate: '2026-06-20',
    checkOutDate: '2026-06-23',
    nights: 3,
    guestCount: 2,
    price: 298,
    totalAmount: 894,
    deposit: 200,
    status: 'confirmed',
    createTime: '2026-06-14 11:30:00'
  },
  {
    id: 'o6',
    orderNo: 'BK20260616006',
    roomTypeId: '1',
    roomTypeName: '海景豪华大床房',
    guestName: '吴女士',
    guestPhone: '132****2222',
    checkInDate: '2026-06-18',
    checkOutDate: '2026-06-22',
    nights: 4,
    guestCount: 2,
    price: 688,
    totalAmount: 2752,
    deposit: 500,
    status: 'confirmed',
    createTime: '2026-06-15 08:45:00',
    remark: '高层海景房'
  },
  {
    id: 'o7',
    orderNo: 'BK20260616007',
    roomTypeId: '6',
    roomTypeName: '豪华海景三人间',
    guestName: '孙先生',
    guestPhone: '131****3333',
    checkInDate: '2026-06-17',
    checkOutDate: '2026-06-19',
    nights: 2,
    guestCount: 3,
    price: 788,
    totalAmount: 1576,
    deposit: 500,
    status: 'pending',
    createTime: '2026-06-16 09:00:00'
  }
];

export const getRoomsByStatus = (status: Room['status']) => {
  return rooms.filter(room => room.status === status);
};

export const getRoomsByFloor = (floor: number) => {
  return rooms.filter(room => room.floor === floor);
};
