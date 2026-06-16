import type { Dish, DiningBooking } from '@/types';

export const dishes: Dish[] = [
  {
    id: 'd1',
    name: '清蒸大龙虾',
    description: '野生海捕大龙虾，清蒸保留原汁原味，肉质鲜嫩弹牙',
    price: 398,
    category: '海鲜主菜',
    image: 'https://picsum.photos/id/292/400/300',
    isRecommended: true,
    isSeafood: true
  },
  {
    id: 'd2',
    name: '蒜蓉粉丝蒸扇贝',
    description: '新鲜扇贝配蒜蓉粉丝，香气四溢，鲜美无比',
    price: 128,
    category: '海鲜主菜',
    image: 'https://picsum.photos/id/312/400/300',
    isRecommended: true,
    isSeafood: true
  },
  {
    id: 'd3',
    name: '海鲜大咖拼盘',
    description: '多种海鲜荟萃，虾蟹贝螺应有尽有，满足味蕾盛宴',
    price: 588,
    category: '海鲜主菜',
    image: 'https://picsum.photos/id/326/400/300',
    isRecommended: true,
    isSeafood: true
  },
  {
    id: 'd4',
    name: '红烧石斑鱼',
    description: '鲜活石斑鱼，肉质细嫩，营养丰富，宴席必备',
    price: 268,
    category: '海鲜主菜',
    image: 'https://picsum.photos/id/401/400/300',
    isRecommended: false,
    isSeafood: true
  },
  {
    id: 'd5',
    name: '辣炒花蛤',
    description: '秘制辣酱爆炒，香辣可口，下酒神器',
    price: 88,
    category: '海鲜热菜',
    image: 'https://picsum.photos/id/431/400/300',
    isRecommended: false,
    isSpicy: true,
    isSeafood: true
  },
  {
    id: 'd6',
    name: '海鲜粥',
    description: '鲜虾蟹肉熬制，鲜美浓郁，营养暖胃',
    price: 68,
    category: '主食粥品',
    image: 'https://picsum.photos/id/570/400/300',
    isRecommended: false,
    isSeafood: true
  },
  {
    id: 'd7',
    name: '椰子鸡汤',
    description: '新鲜椰子配走地鸡，清甜滋补，海岛特色',
    price: 158,
    category: '汤品',
    image: 'https://picsum.photos/id/580/400/300',
    isRecommended: true,
    isSeafood: false
  },
  {
    id: 'd8',
    name: '清炒时蔬',
    description: '海岛时令蔬菜，清新鲜嫩',
    price: 38,
    category: '素菜',
    image: 'https://picsum.photos/id/625/400/300',
    isRecommended: false,
    isSeafood: false
  },
  {
    id: 'd9',
    name: '芒果班戟',
    description: '新鲜芒果制作，香甜软糯，餐后甜点',
    price: 48,
    category: '甜点',
    image: 'https://picsum.photos/id/835/400/300',
    isRecommended: true,
    isSeafood: false
  },
  {
    id: 'd10',
    name: '海鲜炒饭',
    description: '虾仁、蟹肉、贝柱等多种海鲜炒制，粒粒分明',
    price: 58,
    category: '主食',
    image: 'https://picsum.photos/id/1080/400/300',
    isRecommended: false,
    isSeafood: true
  }
];

export const diningBookings: DiningBooking[] = [
  {
    id: 'db1',
    orderNo: 'DN20260616001',
    guestName: '王先生',
    guestPhone: '137****9012',
    date: '2026-06-17',
    time: '18:30',
    guestsCount: 4,
    tableNumber: 'A03',
    dishes: [
      { dishId: 'd1', dishName: '清蒸大龙虾', quantity: 1, price: 398 },
      { dishId: 'd2', dishName: '蒜蓉粉丝蒸扇贝', quantity: 1, price: 128 },
      { dishId: 'd7', dishName: '椰子鸡汤', quantity: 1, price: 158 }
    ],
    totalAmount: 684,
    status: 'confirmed',
    remark: '靠窗户位置'
  },
  {
    id: 'db2',
    orderNo: 'DN20260616002',
    guestName: '李女士',
    guestPhone: '139****5678',
    date: '2026-06-16',
    time: '12:00',
    guestsCount: 2,
    tableNumber: 'B05',
    dishes: [
      { dishId: 'd6', dishName: '海鲜粥', quantity: 1, price: 68 },
      { dishId: 'd8', dishName: '清炒时蔬', quantity: 1, price: 38 }
    ],
    totalAmount: 106,
    status: 'completed'
  },
  {
    id: 'db3',
    orderNo: 'DN20260616003',
    guestName: '陈女士一家',
    guestPhone: '136****3456',
    date: '2026-06-17',
    time: '19:00',
    guestsCount: 6,
    tableNumber: 'VIP01',
    dishes: [
      { dishId: 'd3', dishName: '海鲜大咖拼盘', quantity: 1, price: 588 },
      { dishId: 'd4', dishName: '红烧石斑鱼', quantity: 1, price: 268 },
      { dishId: 'd7', dishName: '椰子鸡汤', quantity: 1, price: 158 },
      { dishId: 'd9', dishName: '芒果班戟', quantity: 2, price: 96 }
    ],
    totalAmount: 1110,
    status: 'pending',
    remark: '小孩不吃辣'
  }
];

export const getDishesByCategory = (category: string) => {
  return dishes.filter(dish => dish.category === category);
};

export const getRecommendedDishes = () => {
  return dishes.filter(dish => dish.isRecommended);
};
