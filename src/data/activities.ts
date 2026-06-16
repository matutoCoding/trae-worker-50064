import type { Activity, ActivityBooking, ServiceEntry } from '@/types';

export const activities: Activity[] = [
  {
    id: 'a1',
    name: '深海潜水体验',
    description: '专业教练一对一指导，探索神秘海底世界，观赏五彩斑斓的珊瑚和热带鱼群。',
    type: 'diving',
    price: 388,
    duration: '约2.5小时',
    maxParticipants: 8,
    currentParticipants: 5,
    startTime: '09:00',
    endTime: '11:30',
    date: '2026-06-17',
    location: '东岛潜点',
    image: 'https://picsum.photos/id/1015/600/400',
    difficulty: 'medium',
    includes: ['专业教练', '潜水装备', '潜水证书', '接送服务', '瓶装水']
  },
  {
    id: 'a2',
    name: '浮潜探秘',
    description: '轻松浮潜，近距离接触海洋生物，适合初学者和家庭出游。',
    type: 'snorkeling',
    price: 168,
    duration: '约2小时',
    maxParticipants: 12,
    currentParticipants: 8,
    startTime: '14:00',
    endTime: '16:00',
    date: '2026-06-17',
    location: '西岛浮潜区',
    image: 'https://picsum.photos/id/1018/600/400',
    difficulty: 'easy',
    includes: ['浮潜装备', '救生衣', '专业向导', '接送服务']
  },
  {
    id: 'a3',
    name: '海钓体验',
    description: '乘坐渔船出海垂钓，体验渔民生活，收获的海鲜可免费加工。',
    type: 'fishing',
    price: 258,
    duration: '约4小时',
    maxParticipants: 6,
    currentParticipants: 4,
    startTime: '06:00',
    endTime: '10:00',
    date: '2026-06-17',
    location: '近海渔场',
    image: 'https://picsum.photos/id/1036/600/400',
    difficulty: 'easy',
    includes: ['渔船', '钓具鱼饵', '渔获加工', '船长指导', '饮用水']
  },
  {
    id: 'a4',
    name: '皮划艇探险',
    description: '双人皮划艇，环岛漫游，探索隐秘海湾，尽享海岛风光。',
    type: 'kayaking',
    price: 128,
    duration: '约2小时',
    maxParticipants: 10,
    currentParticipants: 6,
    startTime: '15:00',
    endTime: '17:00',
    date: '2026-06-17',
    location: '南湾海域',
    image: 'https://picsum.photos/id/1039/600/400',
    difficulty: 'easy',
    includes: ['皮划艇', '船桨', '救生衣', '安全指导']
  },
  {
    id: 'a5',
    name: '高级潜水课程',
    description: 'PADI认证潜水课程，完成后可获得国际潜水证书，开启深度探索之旅。',
    type: 'diving',
    price: 2688,
    duration: '3天',
    maxParticipants: 4,
    currentParticipants: 2,
    startTime: '09:00',
    endTime: '17:00',
    date: '2026-06-18',
    location: '深海潜点',
    image: 'https://picsum.photos/id/1044/600/400',
    difficulty: 'hard',
    includes: ['PADI教材', '全套装备', '专业教练', '证书费用', '午餐', '接送']
  },
  {
    id: 'a6',
    name: '夜潜体验',
    description: '夜间潜水探索，观赏夜间活动的海洋生物，体验不一样的海底世界。',
    type: 'diving',
    price: 488,
    duration: '约3小时',
    maxParticipants: 6,
    currentParticipants: 3,
    startTime: '19:00',
    endTime: '22:00',
    date: '2026-06-18',
    location: '夜潜点',
    image: 'https://picsum.photos/id/1048/600/400',
    difficulty: 'hard',
    includes: ['专业教练', '潜水装备', '水下手电', '接送服务', '热饮']
  }
];

export const activityBookings: ActivityBooking[] = [
  {
    id: 'ab1',
    activityId: 'a1',
    activityName: '深海潜水体验',
    guestName: '王先生',
    guestPhone: '137****9012',
    participants: 2,
    totalPrice: 776,
    status: 'confirmed',
    bookingTime: '2026-06-14 10:30:00'
  },
  {
    id: 'ab2',
    activityId: 'a2',
    activityName: '浮潜探秘',
    guestName: '李女士',
    guestPhone: '139****5678',
    participants: 3,
    totalPrice: 504,
    status: 'confirmed',
    bookingTime: '2026-06-15 14:20:00'
  },
  {
    id: 'ab3',
    activityId: 'a3',
    activityName: '海钓体验',
    guestName: '陈先生',
    guestPhone: '136****3456',
    participants: 4,
    totalPrice: 1032,
    status: 'completed',
    bookingTime: '2026-06-12 09:15:00'
  }
];

export const serviceEntries: ServiceEntry[] = [
  {
    id: 'se1',
    name: '船班接驳',
    description: '轮渡班次查询与上岛接送安排',
    icon: '⛴️',
    pagePath: '/pages/ferry/index',
    color: '#0088cc',
    bgColor: 'rgba(0, 136, 204, 0.1)'
  },
  {
    id: 'se2',
    name: '活动预约',
    description: '潜水浮潜海钓等海岛活动',
    icon: '🤿',
    pagePath: '/pages/activity/index',
    color: '#ff8c42',
    bgColor: 'rgba(255, 140, 66, 0.1)'
  },
  {
    id: 'se3',
    name: '餐饮预订',
    description: '海鲜大餐与特色美食预订',
    icon: '🦞',
    pagePath: '/pages/dining/index',
    color: '#e74c3c',
    bgColor: 'rgba(231, 76, 60, 0.1)'
  },
  {
    id: 'se4',
    name: '退订处理',
    description: '台风停航及退订退款申请',
    icon: '📋',
    pagePath: '/pages/refund/index',
    color: '#9b59b6',
    bgColor: 'rgba(155, 89, 182, 0.1)'
  }
];
