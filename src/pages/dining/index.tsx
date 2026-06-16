import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, Button, Picker, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { dishes } from '@/data/dining';
import { useAppStore } from '@/store';
import { formatPrice, formatDate, getStatusText } from '@/utils';
import classnames from 'classnames';
import type { DiningBooking, Dish } from '@/types';

type CategoryType = 'all' | '海鲜' | '热菜' | '凉菜' | '主食' | '汤类' | '甜点';

const timeSlots: string[] = [
  '午餐 11:00', '午餐 11:30', '午餐 12:00', '午餐 12:30',
  '晚餐 17:00', '晚餐 17:30', '晚餐 18:00', '晚餐 18:30', '晚餐 19:00', '晚餐 19:30'
];

const categoryMap: Record<string, CategoryType> = {
  '海鲜主菜': '海鲜',
  '海鲜热菜': '海鲜',
  '素菜': '凉菜',
  '主食': '主食',
  '主食粥品': '主食',
  '汤品': '汤类',
  '甜点': '甜点'
};

const reasonTypeOptions: { value: 'typhoon' | 'personal' | 'other'; label: string }[] = [
  { value: 'typhoon', label: '台风停航' },
  { value: 'personal', label: '个人原因' },
  { value: 'other', label: '其他原因' }
];

const DiningPage: React.FC = () => {
  const [category, setCategory] = useState<CategoryType>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bookingDate, setBookingDate] = useState<string>(formatDate(new Date()));
  const [timeIndex, setTimeIndex] = useState<number>(6);
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [remark, setRemark] = useState<string>('');

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundOrder, setRefundOrder] = useState<DiningBooking | null>(null);
  const [refundReasonType, setRefundReasonType] = useState<number>(0);
  const [refundRemark, setRefundRemark] = useState<string>('');

  const diningBookings = useAppStore(state => state.diningBookings);
  const createDiningBooking = useAppStore(state => state.createDiningBooking);
  const addRefundRequest = useAppStore(state => state.addRefundRequest);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
  });

  const categories: { id: CategoryType; name: string }[] = [
    { id: 'all', name: '全部' },
    { id: '海鲜', name: '海鲜' },
    { id: '热菜', name: '热菜' },
    { id: '凉菜', name: '凉菜' },
    { id: '主食', name: '主食' },
    { id: '汤类', name: '汤类' },
    { id: '甜点', name: '甜点' }
  ];

  const bookingTime = timeSlots[timeIndex];

  const dishesWithMappedCategory: (Dish & { mappedCategory: CategoryType })[] = useMemo(() => {
    return dishes.map(dish => ({
      ...dish,
      mappedCategory: categoryMap[dish.category] || '热菜'
    }));
  }, []);

  const filteredDishes = useMemo(() => {
    if (category === 'all') return dishesWithMappedCategory;
    return dishesWithMappedCategory.filter(d => d.mappedCategory === category);
  }, [category, dishesWithMappedCategory]);

  const selectedDishes = useMemo(() => {
    return Object.keys(quantities)
      .map(dishId => {
        const qty = quantities[dishId] || 0;
        const dish = dishes.find(d => d.id === dishId);
        if (dish && qty > 0) {
          return {
            dishId,
            dishName: dish.name,
            quantity: qty,
            price: dish.price,
            subtotal: dish.price * qty
          };
        }
        return null;
      })
      .filter(Boolean) as {
        dishId: string;
        dishName: string;
        quantity: number;
        price: number;
        subtotal: number;
      }[];
  }, [quantities]);

  const totalInfo = useMemo(() => {
    const totalCount = selectedDishes.reduce((sum, d) => sum + d.quantity, 0);
    const totalPrice = selectedDishes.reduce((sum, d) => sum + d.subtotal, 0);
    return { totalCount, totalPrice };
  }, [selectedDishes]);

  const sortedBookings = useMemo(() => {
    return [...diningBookings].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [diningBookings]);

  const handleQuantityChange = useCallback((dishId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dishId]: next };
    });
  }, []);

  const handleGuestsChange = useCallback((delta: number) => {
    setGuestsCount(prev => Math.min(20, Math.max(1, prev + delta)));
  }, []);

  const handleOpenConfirm = useCallback(() => {
    if (totalInfo.totalCount === 0) {
      Taro.showToast({ title: '请先选择菜品', icon: 'none' });
      return;
    }
    setShowConfirmModal(true);
  }, [totalInfo.totalCount]);

  const handleConfirmSubmit = useCallback(() => {
    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!guestPhone.trim()) {
      Taro.showToast({ title: '请输入电话', icon: 'none' });
      return;
    }

    const bookingData = {
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      date: bookingDate,
      time: bookingTime,
      guestsCount,
      dishes: selectedDishes.map(d => ({
        dishId: d.dishId,
        dishName: d.dishName,
        quantity: d.quantity,
        price: d.price
      })),
      totalAmount: totalInfo.totalPrice,
      remark: remark.trim() || undefined
    };

    const result = createDiningBooking(bookingData);

    if (result) {
      Taro.showToast({ title: '预订成功', icon: 'success' });
      setShowConfirmModal(false);
      setQuantities({});
      setGuestName('');
      setGuestPhone('');
      setRemark('');
    } else {
      Taro.showToast({ title: '预订失败', icon: 'none' });
    }
  }, [
    guestName,
    guestPhone,
    bookingDate,
    bookingTime,
    guestsCount,
    selectedDishes,
    totalInfo.totalPrice,
    remark,
    createDiningBooking
  ]);

  const toggleOrderExpand = useCallback((orderId: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const handleOpenRefund = useCallback((order: DiningBooking) => {
    setRefundOrder(order);
    setRefundReasonType(0);
    setRefundRemark('');
    setShowRefundModal(true);
  }, []);

  const handleRefundSubmit = useCallback(() => {
    if (!refundOrder) return;

    const reasonType = reasonTypeOptions[refundReasonType].value;
    const reason = refundRemark.trim() || reasonTypeOptions[refundReasonType].label;

    addRefundRequest({
      orderType: 'dining',
      orderId: refundOrder.id,
      orderNo: refundOrder.orderNo,
      guestName: refundOrder.guestName,
      reason,
      reasonType,
      refundAmount: refundOrder.totalAmount,
      totalAmount: refundOrder.totalAmount
    });

    Taro.showToast({ title: '申请已提交', icon: 'success' });
    setShowRefundModal(false);
    setRefundOrder(null);
    setRefundRemark('');
  }, [refundOrder, refundReasonType, refundRemark, addRefundRequest]);

  const canRefund = (status: string) => {
    return ['pending', 'confirmed'].includes(status);
  };

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
            value={timeIndex}
            onChange={e => setTimeIndex(Number(e.detail.value))}
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
                onClick={() => handleGuestsChange(-1)}
              >-</Button>
              <Text className={styles.guestsValue}>{guestsCount}人</Text>
              <Button
                className={styles.guestsBtn}
                onClick={() => handleGuestsChange(1)}
              >+</Button>
            </View>
          </View>
        </View>
      </View>

      {sortedBookings.length > 0 && (
        <View className={styles.ordersSection}>
          <View className={styles.ordersHeader}>
            <Text className={styles.ordersTitle}>我的订单</Text>
            <Text className={styles.ordersCount}>{sortedBookings.length} 笔</Text>
          </View>
          <ScrollView className={styles.ordersList} scrollY>
            {sortedBookings.map(order => {
              const isExpanded = expandedOrderIds.has(order.id);
              return (
                <View
                  key={order.id}
                  className={styles.orderCard}
                >
                  <View
                    className={styles.orderHeader}
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <View className={styles.orderHeaderLeft}>
                      <Text className={styles.orderNo}>{order.orderNo}</Text>
                      <View
                        className={classnames(
                          styles.orderStatus,
                          styles[`status-${order.status}`]
                        )}
                      >
                        {getStatusText(order.status, 'order')}
                      </View>
                    </View>
                    <Text className={classnames(styles.arrow, isExpanded && styles.expanded)}>
                      ▼
                    </Text>
                  </View>

                  <View
                    className={styles.orderSummary}
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <View className={styles.orderMeta}>
                      <Text className={styles.orderMetaItem}>📅 {order.date} {order.time}</Text>
                      <Text className={styles.orderMetaItem}>👥 {order.guestsCount}人</Text>
                    </View>
                    <View className={styles.orderTotalWrap}>
                      <Text className={styles.orderTotal}>{formatPrice(order.totalAmount)}</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View className={styles.orderDetail}>
                      <View className={styles.detailSection}>
                        <Text className={styles.detailTitle}>菜品明细</Text>
                        {order.dishes.map((dish, idx) => (
                          <View key={idx} className={styles.detailDishRow}>
                            <Text className={styles.dishName}>
                              {dish.dishName} × {dish.quantity}
                            </Text>
                            <Text className={styles.dishSubtotal}>
                              {formatPrice(dish.price * dish.quantity)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View className={styles.detailSection}>
                        <Text className={styles.detailTitle}>客人信息</Text>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>姓名</Text>
                          <Text className={styles.detailValue}>{order.guestName}</Text>
                        </View>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>电话</Text>
                          <Text className={styles.detailValue}>{order.guestPhone}</Text>
                        </View>
                        {order.remark && (
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>备注</Text>
                            <Text className={styles.detailValue}>{order.remark}</Text>
                          </View>
                        )}
                      </View>

                      <View className={styles.detailSection}>
                        <Text className={styles.detailTitle}>其他信息</Text>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>用餐时间</Text>
                          <Text className={styles.detailValue}>{order.date} {order.time}</Text>
                        </View>
                        {order.createTime && (
                          <View className={styles.detailRow}>
                            <Text className={styles.detailLabel}>创建时间</Text>
                            <Text className={styles.detailValue}>{order.createTime}</Text>
                          </View>
                        )}
                      </View>

                      {canRefund(order.status) && (
                        <View className={styles.orderActions}>
                          <Button
                            className={styles.refundBtn}
                            onClick={() => handleOpenRefund(order)}
                          >
                            申请退订
                          </Button>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
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

      {totalInfo.totalCount > 0 && (
        <View
          className={styles.cartFab}
          onClick={handleOpenConfirm}
        >
          <View className={styles.cartIconWrap}>
            <Text className={styles.cartIcon}>🛒</Text>
            <View className={styles.cartBadge}>{totalInfo.totalCount}</View>
          </View>
          <View className={styles.cartInfo}>
            <Text className={styles.cartPrice}>{formatPrice(totalInfo.totalPrice)}</Text>
            <Text className={styles.cartText}>去结算</Text>
          </View>
        </View>
      )}

      {showConfirmModal && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认订单</Text>
              <Text
                className={styles.modalClose}
                onClick={() => setShowConfirmModal(false)}
              >
                ×
              </Text>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.confirmSection}>
                <Text className={styles.confirmSectionTitle}>用餐信息</Text>
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
                  <Text className={styles.confirmValue}>{guestsCount}人</Text>
                </View>
              </View>

              <View className={styles.confirmSection}>
                <Text className={styles.confirmSectionTitle}>菜品明细</Text>
                {selectedDishes.map((dish, idx) => (
                  <View key={idx} className={styles.confirmDish}>
                    <View className={styles.confirmDishLeft}>
                      <Text className={styles.confirmDishName}>{dish.dishName}</Text>
                      <Text className={styles.confirmDishQty}>
                        ×{dish.quantity}  {formatPrice(dish.price)}/份
                      </Text>
                    </View>
                    <Text className={styles.confirmDishSubtotal}>
                      {formatPrice(dish.subtotal)}
                    </Text>
                  </View>
                ))}
                <View className={styles.confirmTotalRow}>
                  <Text className={styles.confirmTotalLabel}>合计</Text>
                  <Text className={styles.confirmTotalPrice}>
                    {formatPrice(totalInfo.totalPrice)}
                  </Text>
                </View>
              </View>

              <View className={styles.confirmSection}>
                <Text className={styles.confirmSectionTitle}>客人信息</Text>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>姓名 *</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='请输入姓名'
                    value={guestName}
                    onInput={e => setGuestName(e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>电话 *</Text>
                  <Input
                    className={styles.formInput}
                    type='number'
                    placeholder='请输入电话'
                    value={guestPhone}
                    onInput={e => setGuestPhone(e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>备注</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='特殊需求（选填）'
                    value={remark}
                    onInput={e => setRemark(e.detail.value)}
                  />
                </View>
              </View>
            </ScrollView>
            <View className={styles.modalFooter}>
              <Button
                className={styles.modalBtnCancel}
                onClick={() => setShowConfirmModal(false)}
              >
                取消
              </Button>
              <Button
                className={styles.modalBtnConfirm}
                onClick={handleConfirmSubmit}
              >
                提交订单
              </Button>
            </View>
          </View>
        </View>
      )}

      {showRefundModal && refundOrder && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>申请退订</Text>
              <Text
                className={styles.modalClose}
                onClick={() => setShowRefundModal(false)}
              >
                ×
              </Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.refundOrderInfo}>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>订单号</Text>
                  <Text className={styles.refundOrderValue}>{refundOrder.orderNo}</Text>
                </View>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>用餐时间</Text>
                  <Text className={styles.refundOrderValue}>
                    {refundOrder.date} {refundOrder.time}
                  </Text>
                </View>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>退款金额</Text>
                  <Text className={styles.refundAmount}>
                    {formatPrice(refundOrder.totalAmount)}
                  </Text>
                </View>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>退订原因 *</Text>
                <Picker
                  mode='selector'
                  range={reasonTypeOptions.map(r => r.label)}
                  value={refundReasonType}
                  onChange={e => setRefundReasonType(Number(e.detail.value))}
                >
                  <View className={styles.pickerInput}>
                    <Text className={styles.pickerText}>
                      {reasonTypeOptions[refundReasonType].label}
                    </Text>
                    <Text className={styles.pickerArrow}>▼</Text>
                  </View>
                </Picker>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注说明</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请补充说明（选填）'
                  value={refundRemark}
                  onInput={e => setRefundRemark(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button
                className={styles.modalBtnCancel}
                onClick={() => setShowRefundModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtnConfirm, styles.danger)}
                onClick={handleRefundSubmit}
              >
                提交申请
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DiningPage;
