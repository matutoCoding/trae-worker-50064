import type { StatsData, DailyRevenue, Review, RefundRequest } from '@/types';

export const statsData: StatsData = {
  todayRevenue: 8650,
  monthRevenue: 186520,
  todayCheckIns: 6,
  todayCheckOuts: 4,
  occupancyRate: 0.72,
  totalRooms: 25,
  occupiedRooms: 18,
  monthOrders: 156,
  avgRating: 4.8,
  totalReviews: 328
};

export const dailyRevenues: DailyRevenue[] = [
  { date: '06-10', revenue: 5200, orders: 8, occupancyRate: 0.52 },
  { date: '06-11', revenue: 6800, orders: 10, occupancyRate: 0.60 },
  { date: '06-12', revenue: 8500, orders: 12, occupancyRate: 0.68 },
  { date: '06-13', revenue: 9200, orders: 14, occupancyRate: 0.72 },
  { date: '06-14', revenue: 7800, orders: 11, occupancyRate: 0.65 },
  { date: '06-15', revenue: 10500, orders: 15, occupancyRate: 0.80 },
  { date: '06-16', revenue: 8650, orders: 13, occupancyRate: 0.72 }
];

export const reviews: Review[] = [
  {
    id: 'rv1',
    guestName: '张女士',
    avatar: 'https://picsum.photos/id/64/200/200',
    rating: 5,
    content: '非常棒的海岛民宿！房间干净整洁，海景无敌，服务也很贴心。早餐丰盛，海鲜餐厅的菜也很好吃。下次还会再来！',
    createTime: '2026-06-15',
    roomTypeName: '海景豪华大床房'
  },
  {
    id: 'rv2',
    guestName: '李先生',
    avatar: 'https://picsum.photos/id/91/200/200',
    rating: 4,
    content: '整体体验不错，民宿位置很好，出门就是海。房间设施稍微有点旧，但还是很干净的。工作人员态度很好，有求必应。',
    createTime: '2026-06-14',
    roomTypeName: '海景标准双床房',
    reply: '感谢您的入住和评价！我们正在逐步更新房间设施，期待您下次入住体验更佳。'
  },
  {
    id: 'rv3',
    guestName: '王小姐',
    avatar: 'https://picsum.photos/id/177/200/200',
    rating: 5,
    content: '蜜月旅行选对了！蜜月套房超级浪漫，圆形大床很舒服，阳台看日出太美了。管家服务很贴心，还送了水果和红酒。强烈推荐！',
    createTime: '2026-06-12',
    roomTypeName: '海景蜜月套房'
  },
  {
    id: 'rv4',
    guestName: '陈先生一家',
    avatar: 'https://picsum.photos/id/338/200/200',
    rating: 5,
    content: '带孩子来的，家庭套房空间很大，有客厅很方便。孩子很喜欢沙滩和浮潜活动，工作人员也很照顾小朋友。很满意的一次家庭旅行！',
    createTime: '2026-06-10',
    roomTypeName: '园景家庭套房'
  },
  {
    id: 'rv5',
    guestName: '刘先生',
    avatar: 'https://picsum.photos/id/1027/200/200',
    rating: 4,
    content: '性价比很高的民宿，环境优美，餐饮也很好吃。唯一不足是上岛交通不太方便，但民宿安排的接驳车还不错。整体推荐！',
    createTime: '2026-06-08',
    roomTypeName: '海景豪华大床房'
  }
];

export const refundRequests: RefundRequest[] = [
  {
    id: 'ref1',
    orderId: 'o8',
    orderNo: 'BK20260610008',
    orderType: 'room',
    guestName: '赵先生',
    reason: '台风影响，无法上岛',
    reasonType: 'typhoon',
    refundAmount: 2064,
    totalAmount: 2064,
    status: 'pending',
    createTime: '2026-06-15 16:30:00'
  },
  {
    id: 'ref2',
    orderId: 'ab5',
    orderNo: 'AC20260612005',
    orderType: 'activity',
    guestName: '孙女士',
    reason: '天气原因，活动取消',
    reasonType: 'typhoon',
    refundAmount: 776,
    totalAmount: 776,
    status: 'approved',
    createTime: '2026-06-14 10:20:00',
    handleTime: '2026-06-14 11:00:00',
    handleRemark: '台风天气，全额退款'
  },
  {
    id: 'ref3',
    orderId: 'db4',
    orderNo: 'DN20260613004',
    orderType: 'dining',
    guestName: '周先生',
    reason: '个人原因，行程变更',
    reasonType: 'personal',
    refundAmount: 300,
    totalAmount: 600,
    status: 'refunded',
    createTime: '2026-06-13 09:00:00',
    handleTime: '2026-06-13 10:30:00',
    handleRemark: '提前24小时退订，退款50%'
  }
];

export const getRefundRequestsByStatus = (status: RefundRequest['status']) => {
  return refundRequests.filter(req => req.status === status);
};
