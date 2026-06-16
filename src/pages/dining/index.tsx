import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, Button, Picker, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { dishes } from '@/data/dining';
import { useAppStore } from '@/store';
import { formatPrice, formatDate } from '@/utils';
import classnames from 'classnames';

type CategoryType = 'all' | '海鲜主菜' | '海鲜热菜' | '主食粥品' | '汤品' | '素菜' | '甜点';

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

interface DiningOrderDisplay {
  id: string;
  orderNo: string;
  date: string;
  time: string;
  guests: number;
  dishes: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  status: string;
  createTime: string;
}

const DiningPage: React.FC = () => {
  const [category, setCategory] = useState<CategoryType>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bookingDate, setBookingDate] = useState(formatDate(new Date()));
  const [bookingTime, setBookingTime] = useState('18:30');
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [myOrders, setMyOrders] = useState<DiningOrderDisplay[]>([]);
  const [showOrders, setShowOrders] = useState(false);

  const diningBookings = useAppStore(state => state.diningBookings);
  const createDiningBooking = useAppStore(state => state.createDiningBooking);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
    const stored = Taro.getStorageSync('dining_orders_display');
    if (stored) {
      setMyOrders(JSON.parse(stored));
    }
  });

  const categories: { id: CategoryType; name: string }[] = [
    { id: 'all', name: '全部' },
    { id: '海鲜主菜', name: '海鲜主菜' },
    { id: '海鲜热菜', name: '海鲜热菜' },
    { id: '主食粥品', name: '主食粥品' },
    { id: '汤品', name: '汤品' },
    { id: '素菜', name: '素菜' },
    { id: '甜点', name: '甜点' }
  ];

  const filteredDishes = useMemo(() => {
    if (category === 'all') return dishes;
    return dishes.filter(d => d.category === category);
  }, [category]);

  const totalInfo = useMemo(() => {
    let totalCount = 0;
    let totalPrice = 0;
    Object.keys(quantities).forEach(dishId => {
      const qty = quantities[dishId] || 0;
      const dish = dishes.find(d => d.id === dishId);
      if (dish && qty > 0) {
        totalCount += qty;
        totalPrice += dish.price * qty;
      }
    });
    return { totalCount, totalPrice };
  }, [quantities]);

  const handleQuantityChange = useCallback((dishId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dishId]: next };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    console.log('[Dining] 提交预订', totalInfo);
    if (totalInfo.totalCount === 0) {
      Taro.showToast({
        title: '请先选择菜品',
        icon: 'none'
      });
      return;
    }
    setShowConfirmModal(true);
  }, [totalInfo]);

  const handleConfirmSubmit = useCallback(() => {
    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!guestPhone.trim()) {
      Taro.showToast({ title: '请输入电话', icon: 'none' });
      return;
    }

    const selectedDishes = Object.keys(quantities)
      .map(dishId => {
        const qty = quantities[dishId] || 0;
        const dish = dishes.find(d => d.id === dishId);
        if (dish && qty > 0) {
          return { dishId, dishName: dish.name, quantity: qty, price: dish.price };
        }
        return null;
      })
      .filter(Boolean) as { dishId: string; dishName: string; quantity: number; price: number }[];

    const booking = createDiningBooking({
      date: bookingDate,
      time: bookingTime,
      guests,
      guestName,
      guestPhone,
      dishes: selectedDishes,
      totalPrice: totalInfo.totalPrice
    });

    const orderDisplay: DiningOrderDisplay = {
      id: booking.id,
      orderNo: booking.orderNo,
      date: bookingDate,
      time: bookingTime,
      guests,
      dishes: selectedDishes.map(d => ({ name: d.dishName, quantity: d.quantity, price: d.price })),
      totalPrice: totalInfo.totalPrice,
      status: '已确认',
      createTime: new Date().toLocaleString('zh-CN')
    };

    const updatedOrders = [orderDisplay, ...myOrders];
    setMyOrders(updatedOrders);
    Taro.setStorageSync('dining_orders_display', JSON.stringify(updatedOrders));

    setShowConfirmModal(false);
    setQuantities({});
    setGuestName('');
    setGuestPhone('');
    Taro.showToast({
      title: '预订成功',
      icon: 'success'
    });
  }, [quantities, bookingDate, bookingTime, guests, guestName, guestPhone, totalInfo, createDiningBooking, myOrders]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>海鲜餐厅</Text>
        <Text className={styles.headerSubtitle}>新鲜海捕 · 现捞现做 · 海岛美味</Text>

        <View className={styles.bookingBar}>
          <Picker
            mode='date'
            value={bookingDate}
            onChange={e => setBookingDate(e.detail.value)}
          >
            <View className={styles.bookingItem}>
              <Text className={styles.label}>用餐日期</Text>
              <Text className={styles.value}>{bookingDate}</Text>
            </View>
          </Picker>
          <View className={styles.bookingDivider} />
          <Picker
            mode='selector'
            range={timeSlots}
            value={timeSlots.indexOf(bookingTime)}
            onChange={e => setBookingTime(timeSlots[Number(e.detail.value)])}
          >
            <View className={styles.bookingItem}>
              <Text className={styles.label}>用餐时间</Text>
              <Text className={styles.value}>{bookingTime}</Text>
            </View>
          </Picker>
          <View className={styles.bookingDivider} />
          <View className={styles.bookingItem}>
            <Text className={styles.label}>用餐人数</Text>
            <View className={styles.guestsSelector}>
              <Button
                className={styles.guestsBtn}
                onClick={() => setGuests(Math.max(1, guests - 1))}
              >-</Button>
              <Text className={styles.guestsValue}>{guests}人</Text>
              <Button
                className={styles.guestsBtn}
                onClick={() => setGuests(Math.min(20, guests + 1))}
              >+</Button>
            </View>
          </View>
        </View>

        <View className={styles.myOrdersBtn} onClick={() => setShowOrders(!showOrders)}>
          <Text className={styles.ordersIcon}>📋</Text>
          <Text className={styles.ordersText}>我的订单 ({myOrders.length})</Text>
          <Text className={styles.ordersArrow}>{showOrders ? '▲' : '▼'}</Text>
        </View>
      </View>

      {showOrders && myOrders.length > 0 && (
        <View className={styles.ordersPanel}>
          {myOrders.map(order => (
            <View key={order.id} className={styles.orderCard}>
              <View className={styles.orderHeader}>
                <Text className={styles.orderNo}>{order.orderNo}</Text>
                <Text className={styles.orderStatus}>{order.status}</Text>
              </View>
              <View className={styles.orderInfo}>
                <Text className={styles.orderTime}>{order.date} {order.time} · {order.guests}人</Text>
                <Text className={styles.orderGuest}>{order.guestName} {order.guestPhone}</Text>
              </View>
              <View className={styles.orderDishes}>
                {order.dishes.map((dish, idx) => (
                  <Text key={idx} className={styles.orderDish}>
                    {dish.name} × {dish.quantity}
                  </Text>
                ))}
              </View>
              <View className={styles.orderFooter}>
                <Text className={styles.orderTotal}>合计: ¥{order.totalPrice}</Text>
                <Text className={styles.orderCreateTime}>{order.createTime}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <ScrollView className={styles.categories} scrollX>
        {categories.map(cat => (
          <View
            key={cat.id}
            className={classnames(styles.categoryItem, category === cat.id && styles.active)}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </View>
        ))}
      </ScrollView>

      <ScrollView className={styles.dishList} scrollY>
        {filteredDishes.length > 0 ? (
          filteredDishes.map(dish => {
            const qty = quantities[dish.id] || 0;
            return (
              <View key={dish.id} className={styles.dishCard}>
                <View className={styles.dishImage}>
                  <Image src={dish.image} mode='aspectFill' />
                  {dish.isRecommended && (
                    <View className={styles.recommendTag}>招牌</View>
                  )}
                  {dish.isSpicy && (
                    <View className={styles.spicyTag}>🌶️辣</View>
                  )}
                </View>
                <View className={styles.dishInfo}>
                  <Text className={styles.dishName}>{dish.name}</Text>
                  <Text className={styles.dishDesc}>{dish.description}</Text>
                  <View className={styles.dishFooter}>
                    <View className={styles.dishPrice}>
                      <Text className={styles.symbol}>¥</Text>
                      <Text className={styles.price}>{dish.price}</Text>
                      <Text className={styles.unit}>/份</Text>
                    </View>
                    <View className={styles.quantityControl}>
                      {qty > 0 && (
                        <>
                          <Button
                            className={styles.quantityBtn}
                            onClick={() => handleQuantityChange(dish.id, -1)}
                          >
                            -
                          </Button>
                          <Text className={styles.quantityValue}>{qty}</Text>
                        </>
                      )}
                      <Button
                        className={classnames(styles.quantityBtn, styles.add)}
                        onClick={() => handleQuantityChange(dish.id, 1)}
                      >
                        +
                      </Button>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.icon}>🍽️</View>
            <Text className={styles.text}>暂无相关菜品</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <View className={styles.totalPrice}>
            <Text className={styles.symbol}>¥</Text>
            <Text className={styles.price}>{totalInfo.totalPrice}</Text>
          </View>
          <Text className={styles.totalCount}>共{totalInfo.totalCount}份菜品</Text>
        </View>
        <Button
          className={classnames(styles.submitBtn, totalInfo.totalCount === 0 && styles.disabled)}
          disabled={totalInfo.totalCount === 0}
          onClick={handleSubmit}
        >
          立即预订
        </Button>
      </View>

      {showConfirmModal && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认预订信息</Text>
              <Text className={styles.modalClose} onClick={() => setShowConfirmModal(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.confirmInfo}>
                <Text className={styles.confirmLabel}>用餐日期</Text>
                <Text className={styles.confirmValue}>{bookingDate}</Text>
              </View>
              <View className={styles.confirmInfo}>
                <Text className={styles.confirmLabel}>用餐时间</Text>
                <Text className={styles.confirmValue}>{bookingTime}</Text>
              </View>
              <View className={styles.confirmInfo}>
                <Text className={styles.confirmLabel}>用餐人数</Text>
                <Text className={styles.confirmValue}>{guests}人</Text>
              </View>
              <View className={styles.confirmInfo}>
                <Text className={styles.confirmLabel}>菜品数量</Text>
                <Text className={styles.confirmValue}>{totalInfo.totalCount}份</Text>
              </View>
              <View className={styles.confirmInfo}>
                <Text className={styles.confirmLabel}>合计金额</Text>
                <Text className={styles.confirmPrice}>¥{totalInfo.totalPrice}</Text>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>联系人姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入姓名'
                  value={guestName}
                  onInput={e => setGuestName(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>联系电话</Text>
                <Input
                  className={styles.formInput}
                  type='number'
                  placeholder='请输入电话'
                  value={guestPhone}
                  onInput={e => setGuestPhone(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnCancel} onClick={() => setShowConfirmModal(false)}>取消</Button>
              <Button className={styles.modalBtnConfirm} onClick={handleConfirmSubmit}>确认预订</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DiningPage;
