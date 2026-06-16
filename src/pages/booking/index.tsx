import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { formatDate, calcNights, formatPrice, getWeekday, getStatusText } from '@/utils';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import type { RoomType, BookingOrder, DailyPriceDetail } from '@/types';

const DEPOSIT_OPTIONS = [200, 300, 500, 1000];
const CALENDAR_DAYS = 14;

const BookingPage: React.FC = () => {
  const today = useMemo(() => formatDate(new Date()), []);

  const getDefaultCheckOut = (checkIn: string): string => {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  };

  const [checkInDate, setCheckInDate] = useState<string>(today);
  const [checkOutDate, setCheckOutDate] = useState<string>(getDefaultCheckOut(today));
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [deposit, setDeposit] = useState(300);

  const roomTypes = useAppStore(state => state.roomTypes);
  const orders = useAppStore(state => state.orders);
  const createBooking = useAppStore(state => state.createBooking);
  const checkRoomAvailability = useAppStore(state => state.checkRoomAvailability);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
    console.log('[Booking] 页面显示，当前订单数:', orders.length);
  });

  const nights = useMemo(() => calcNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

  const calendarDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(checkInDate);
    for (let i = 0; i < CALENDAR_DAYS; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  }, [checkInDate]);

  const selectedRoomType = useMemo(() => {
    return roomTypes.find(r => r.id === selectedRoomTypeId) || null;
  }, [roomTypes, selectedRoomTypeId]);

  const availability = useMemo(() => {
    if (!selectedRoomTypeId) return { available: false, dailyPrices: [] as DailyPriceDetail[], totalPrice: 0 };
    return checkRoomAvailability(selectedRoomTypeId, checkInDate, checkOutDate);
  }, [selectedRoomTypeId, checkInDate, checkOutDate, checkRoomAvailability]);

  const selectedDateRangeSet = useMemo(() => {
    const set = new Set<string>();
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const current = new Date(start);
    while (current < end) {
      set.add(formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    return set;
  }, [checkInDate, checkOutDate]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }, [orders]);

  const handleCheckInChange = useCallback((e: any) => {
    const newDate = e.detail.value;
    setCheckInDate(newDate);
    const ci = new Date(newDate);
    const co = new Date(checkOutDate);
    if (ci >= co) {
      setCheckOutDate(getDefaultCheckOut(newDate));
    }
    console.log('[Booking] 入住日期:', newDate);
  }, [checkOutDate]);

  const handleCheckOutChange = useCallback((e: any) => {
    const newDate = e.detail.value;
    const ci = new Date(checkInDate);
    const co = new Date(newDate);
    if (co <= ci) {
      Taro.showToast({ title: '离店日期需晚于入住日期', icon: 'none' });
      return;
    }
    if (calcNights(checkInDate, newDate) < 1) {
      Taro.showToast({ title: '至少住1晚', icon: 'none' });
      return;
    }
    setCheckOutDate(newDate);
    console.log('[Booking] 离店日期:', newDate);
  }, [checkInDate]);

  const handleRoomSelect = useCallback((roomTypeId: string) => {
    const room = roomTypes.find(r => r.id === roomTypeId);
    if (!room) return;
    if (room.availableCount <= 0) {
      Taro.showToast({ title: '该房型已订满', icon: 'none' });
      return;
    }
    const { available } = checkRoomAvailability(roomTypeId, checkInDate, checkOutDate);
    if (!available) {
      Taro.showToast({ title: '所选日期库存不足', icon: 'none' });
      return;
    }
    setSelectedRoomTypeId(roomTypeId);
    setDeposit(room.price >= 1000 ? 1000 : room.price >= 500 ? 500 : 300);
    setGuestCount(Math.min(2, room.capacity));
    setShowBookingModal(true);
    console.log('[Booking] 选择房型:', room.name);
  }, [roomTypes, checkInDate, checkOutDate, checkRoomAvailability]);

  const handleSubmit = useCallback(() => {
    if (!selectedRoomType) return;
    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入客人姓名', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(guestPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      Taro.showToast({ title: '请输入正确的身份证号', icon: 'none' });
      return;
    }
    if (guestCount > selectedRoomType.capacity) {
      Taro.showToast({ title: `该房型最多住${selectedRoomType.capacity}人`, icon: 'none' });
      return;
    }
    if (!availability.available) {
      Taro.showToast({ title: '所选日期库存不足', icon: 'none' });
      return;
    }

    const order = createBooking({
      roomTypeId: selectedRoomType.id,
      roomTypeName: selectedRoomType.name,
      guestName: guestName.trim(),
      guestPhone,
      idCard: idCard.toUpperCase(),
      checkInDate,
      checkOutDate,
      nights: availability.dailyPrices.length,
      guestCount,
      price: availability.dailyPrices.length > 0 ? availability.dailyPrices[0].price : selectedRoomType.price,
      totalAmount: availability.totalPrice,
      deposit
    });

    if (order) {
      Taro.showToast({ title: '预订成功', icon: 'success' });
      console.log('[Booking] 生成订单:', order);
      setShowBookingModal(false);
      setGuestName('');
      setGuestPhone('');
      setIdCard('');
      setSelectedRoomTypeId('');
    } else {
      Taro.showToast({ title: '预订失败，库存不足', icon: 'none' });
    }
  }, [selectedRoomType, guestName, guestPhone, idCard, guestCount, availability, checkInDate, checkOutDate, deposit, createBooking]);

  const toggleOrderExpand = useCallback((orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  }, []);

  const guestCountOptions = useMemo(() => {
    const max = Math.min(6, selectedRoomType?.capacity || 6);
    return Array.from({ length: max }, (_, i) => `${i + 1}人`);
  }, [selectedRoomType]);

  const getDailyInfo = (roomType: RoomType, date: string) => {
    const rate = roomType.dailyRates.find(d => d.date === date);
    return {
      price: rate ? rate.price : roomType.price,
      available: rate ? rate.available : roomType.availableCount
    };
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const totalWithDeposit = useMemo(() => {
    return availability.totalPrice + deposit;
  }, [availability.totalPrice, deposit]);

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>房间预订</Text>
          <Text className={styles.headerSubtitle}>选择日期房型 · 一键预订</Text>

          <View className={styles.dateSelector}>
            <Picker mode='date' value={checkInDate} start={today} onChange={handleCheckInChange}>
              <View className={styles.dateItem}>
                <Text className={styles.label}>入住</Text>
                <Text className={styles.value}>{formatDateShort(checkInDate)}</Text>
                <Text className={styles.weekday}>{getWeekday(checkInDate)}</Text>
              </View>
            </Picker>
            <View className={styles.dateArrowWrap}>
              <Text className={styles.dateArrow}>→</Text>
              <View className={styles.nightsBadge}>{nights}晚</View>
            </View>
            <Picker mode='date' value={checkOutDate} start={getDefaultCheckOut(checkInDate)} onChange={handleCheckOutChange}>
              <View className={styles.dateItem}>
                <Text className={styles.label}>离店</Text>
                <Text className={styles.value}>{formatDateShort(checkOutDate)}</Text>
                <Text className={styles.weekday}>{getWeekday(checkOutDate)}</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className={styles.calendarSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>未来{CALENDAR_DAYS}天房价日历</Text>
            <Text className={styles.sectionSubtitle}>点击房型卡片即可预订</Text>
          </View>

          <View className={styles.calendarContainer}>
            <ScrollView className={styles.calendarScroll} scrollX>
              <View className={styles.calendar}>
                <View className={styles.calendarHeaderRow}>
                  <View className={styles.calendarCorner}>房型 / 日期</View>
                  {calendarDates.map(date => (
                    <View
                      key={date}
                      className={classnames(
                        styles.calendarHeaderCell,
                        selectedDateRangeSet.has(date) && styles.inRange
                      )}
                    >
                      <Text className={styles.cellDate}>{formatDateShort(date)}</Text>
                      <Text className={styles.cellWeekday}>{getWeekday(date).replace('周', '')}</Text>
                    </View>
                  ))}
                </View>

                {roomTypes.map(roomType => (
                  <View key={roomType.id} className={styles.calendarRoomRow}>
                    <View
                      className={classnames(
                        styles.roomNameCell,
                        roomType.availableCount <= 0 && styles.roomDisabled
                      )}
                      onClick={() => handleRoomSelect(roomType.id)}
                    >
                      <Text className={styles.roomNameText}>{roomType.name}</Text>
                      <Text className={styles.roomCapacity}>可住{roomType.capacity}人</Text>
                    </View>
                    {calendarDates.map(date => {
                      const info = getDailyInfo(roomType, date);
                      const isSelected = selectedDateRangeSet.has(date);
                      const isFull = info.available <= 0;
                      return (
                        <View
                          key={date}
                          className={classnames(
                            styles.dateCell,
                            isSelected && styles.cellSelected,
                            isFull && styles.cellFull
                          )}
                          onClick={() => handleRoomSelect(roomType.id)}
                        >
                          <Text className={classnames(styles.cellPrice, isFull && styles.textMuted)}>
                            {formatPrice(info.price)}
                          </Text>
                          <Text className={classnames(styles.cellAvail, isFull ? styles.textDanger : styles.textSuccess)}>
                            {isFull ? '满' : `剩${info.available}`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {selectedRoomTypeId && (
          <View className={styles.summarySection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>预订明细</Text>
            </View>
            <View className={styles.summaryCard}>
              <View className={styles.summaryRoomInfo}>
                <Text className={styles.summaryRoomName}>{selectedRoomType?.name}</Text>
                <Text className={styles.summaryRoomMeta}>
                  {selectedRoomType?.bedType} · {selectedRoomType?.size}㎡
                </Text>
              </View>
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>入住日期</Text>
                <Text className={styles.summaryValue}>{checkInDate}</Text>
              </View>
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>离店日期</Text>
                <Text className={styles.summaryValue}>{checkOutDate}</Text>
              </View>
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>间夜数</Text>
                <Text className={styles.summaryValue}>{nights}晚</Text>
              </View>

              <View className={styles.dailyPriceList}>
                <Text className={styles.dailyPriceTitle}>每日房价明细</Text>
                {availability.dailyPrices.map(dp => (
                  <View key={dp.date} className={styles.dailyPriceItem}>
                    <Text className={styles.dailyPriceDate}>
                      {dp.date} {getWeekday(dp.date)}
                    </Text>
                    <Text className={styles.dailyPriceAmount}>{formatPrice(dp.price)}</Text>
                  </View>
                ))}
              </View>

              <View className={styles.summaryDivider} />
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>房费合计</Text>
                <Text className={styles.summaryPrice}>{formatPrice(availability.totalPrice)}</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.ordersSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的订单</Text>
            <Text className={styles.sectionCount}>共 {orders.length} 条</Text>
          </View>

          {sortedOrders.length > 0 ? (
            sortedOrders.map(order => (
              <View
                key={order.id}
                className={classnames(styles.orderCard, expandedOrderId === order.id && styles.expanded)}
              >
                <View className={styles.orderHeader} onClick={() => toggleOrderExpand(order.id)}>
                  <View className={styles.orderHeaderLeft}>
                    <Text className={styles.orderNo}>{order.orderNo}</Text>
                    <View
                      className={classnames(styles.orderStatus, styles[`status-${order.status}`])}
                    >
                      {getStatusText(order.status, 'order')}
                    </View>
                  </View>
                  <Text className={classnames(styles.expandIcon, expandedOrderId === order.id && styles.rotated)}>
                    ▼
                  </Text>
                </View>

                <View className={styles.orderBasic} onClick={() => toggleOrderExpand(order.id)}>
                  <Text className={styles.orderRoomName}>{order.roomTypeName}</Text>
                  <View className={styles.orderRow}>
                    <Text className={styles.orderLabel}>日期</Text>
                    <Text className={styles.orderValue}>
                      {order.checkInDate} ~ {order.checkOutDate}
                    </Text>
                  </View>
                  <View className={styles.orderRow}>
                    <Text className={styles.orderLabel}>间夜</Text>
                    <Text className={styles.orderValue}>{order.nights}晚 · {order.guestCount}人</Text>
                  </View>
                  <View className={styles.orderRow}>
                    <Text className={styles.orderLabel}>客人</Text>
                    <Text className={styles.orderValue}>{order.guestName}</Text>
                  </View>
                  <View className={styles.orderRow}>
                    <Text className={styles.orderLabel}>总价</Text>
                    <Text className={styles.orderTotal}>{formatPrice(order.totalAmount)}</Text>
                  </View>
                  <View className={styles.orderRow}>
                    <Text className={styles.orderLabel}>押金</Text>
                    <Text className={styles.orderValue}>{formatPrice(order.deposit)}</Text>
                  </View>
                </View>

                {expandedOrderId === order.id && (
                  <View className={styles.orderDetail}>
                    <View className={styles.detailDivider} />
                    <Text className={styles.detailTitle}>每日房价明细</Text>
                    <View className={styles.detailTable}>
                      <View className={styles.detailTableHeader}>
                        <Text className={styles.detailTh}>日期</Text>
                        <Text className={styles.detailTh}>星期</Text>
                        <Text className={styles.detailTh}>房价</Text>
                      </View>
                      {order.dailyPrices.map(dp => (
                        <View key={dp.date} className={styles.detailTableRow}>
                          <Text className={styles.detailTd}>{dp.date}</Text>
                          <Text className={styles.detailTd}>{getWeekday(dp.date)}</Text>
                          <Text className={classnames(styles.detailTd, styles.detailPrice)}>
                            {formatPrice(dp.price)}
                          </Text>
                        </View>
                      ))}
                      <View className={styles.detailTableFooter}>
                        <Text className={styles.detailFooterLabel}>合计 {order.nights} 晚</Text>
                        <Text className={styles.detailFooterPrice}>{formatPrice(order.totalAmount)}</Text>
                      </View>
                    </View>

                    <View className={styles.orderMeta}>
                      <View className={styles.orderMetaRow}>
                        <Text className={styles.orderMetaLabel}>手机号</Text>
                        <Text className={styles.orderMetaValue}>{order.guestPhone}</Text>
                      </View>
                      {order.idCard && (
                        <View className={styles.orderMetaRow}>
                          <Text className={styles.orderMetaLabel}>身份证</Text>
                          <Text className={styles.orderMetaValue}>{order.idCard}</Text>
                        </View>
                      )}
                      <View className={styles.orderMetaRow}>
                        <Text className={styles.orderMetaLabel}>创建时间</Text>
                        <Text className={styles.orderMetaValue}>{order.createTime}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <View className={styles.icon}>📋</View>
              <Text className={styles.text}>暂无订单</Text>
              <Text className={styles.subText}>选择房型开始预订吧</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showBookingModal && selectedRoomType && (
        <View className={styles.modalMask} onClick={() => setShowBookingModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认预订</Text>
              <Text className={styles.modalClose} onClick={() => setShowBookingModal(false)}>✕</Text>
            </View>

            <ScrollView className={styles.modalContent} scrollY>
              <View className={styles.modalRoom}>
                <View className={styles.modalRoomImage}>🏖️</View>
                <View className={styles.modalRoomInfo}>
                  <Text className={styles.modalRoomName}>{selectedRoomType.name}</Text>
                  <Text className={styles.modalRoomMeta}>
                    {selectedRoomType.bedType} · {selectedRoomType.size}㎡ · 可住{selectedRoomType.capacity}人
                  </Text>
                </View>
              </View>

              <View className={styles.modalSection}>
                <Text className={styles.modalSectionTitle}>入住信息</Text>
                <View className={styles.modalDateRow}>
                  <View className={styles.modalDateItem}>
                    <Text className={styles.modalDateLabel}>入住</Text>
                    <Text className={styles.modalDateValue}>{checkInDate}</Text>
                    <Text className={styles.modalDateWeekday}>{getWeekday(checkInDate)}</Text>
                  </View>
                  <Text className={styles.modalDateArrow}>→</Text>
                  <View className={styles.modalDateItem}>
                    <Text className={styles.modalDateLabel}>离店</Text>
                    <Text className={styles.modalDateValue}>{checkOutDate}</Text>
                    <Text className={styles.modalDateWeekday}>{getWeekday(checkOutDate)}</Text>
                  </View>
                </View>
                <View className={styles.modalNightsRow}>
                  <Text>共 <Text className={styles.highlight}>{nights}</Text> 晚</Text>
                </View>
              </View>

              <View className={styles.modalSection}>
                <Text className={styles.modalSectionTitle}>每日房价明细</Text>
                <View className={styles.modalDailyList}>
                  {availability.dailyPrices.map(dp => (
                    <View key={dp.date} className={styles.modalDailyItem}>
                      <View className={styles.modalDailyDate}>
                        <Text className={styles.modalDailyDateText}>{dp.date}</Text>
                        <Text className={styles.modalDailyWeekday}>{getWeekday(dp.date)}</Text>
                      </View>
                      <Text className={styles.modalDailyPrice}>{formatPrice(dp.price)}</Text>
                    </View>
                  ))}
                </View>
                <View className={styles.modalDailyTotal}>
                  <Text className={styles.modalDailyTotalLabel}>房费合计</Text>
                  <Text className={styles.modalDailyTotalValue}>{formatPrice(availability.totalPrice)}</Text>
                </View>
              </View>

              <View className={styles.modalSection}>
                <Text className={styles.modalSectionTitle}>客人信息</Text>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>姓名</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='请输入客人姓名'
                    value={guestName}
                    onInput={e => setGuestName(e.detail.value)}
                    maxlength={20}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>手机号</Text>
                  <Input
                    className={styles.formInput}
                    type='number'
                    placeholder='请输入手机号'
                    value={guestPhone}
                    onInput={e => setGuestPhone(e.detail.value)}
                    maxlength={11}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>身份证号</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='请输入18位身份证号'
                    value={idCard}
                    onInput={e => setIdCard(e.detail.value)}
                    maxlength={18}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>入住人数</Text>
                  <Picker
                    mode='selector'
                    range={guestCountOptions}
                    value={guestCount - 1}
                    onChange={e => setGuestCount(Number(e.detail.value) + 1)}
                  >
                    <View className={styles.formPicker}>
                      {guestCount}人
                      <Text className={styles.pickerArrow}>▼</Text>
                    </View>
                  </Picker>
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>押金选择</Text>
                  <View className={styles.depositRow}>
                    {DEPOSIT_OPTIONS.map(d => (
                      <View
                        key={d}
                        className={classnames(styles.depositOption, deposit === d && styles.depositSelected)}
                        onClick={() => setDeposit(d)}
                      >
                        {formatPrice(d)}
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View className={styles.modalSummary}>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>房费</Text>
                  <Text className={styles.summaryValue}>{formatPrice(availability.totalPrice)}</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>押金</Text>
                  <Text className={styles.summaryValue}>{formatPrice(deposit)}</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>合计应付</Text>
                  <Text className={styles.summaryTotal}>{formatPrice(totalWithDeposit)}</Text>
                </View>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.cancelBtn} onClick={() => setShowBookingModal(false)}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleSubmit}>
                确认预订
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookingPage;
