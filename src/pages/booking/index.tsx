import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RoomCard from '@/components/RoomCard';
import { formatDate, calcNights, formatPrice } from '@/utils';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import type { RoomType } from '@/types';

const BookingPage: React.FC = () => {
  const [checkInDate, setCheckInDate] = useState<string>('2026-06-17');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-06-20');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [deposit, setDeposit] = useState(0);

  const roomTypes = useAppStore(state => state.roomTypes);
  const orders = useAppStore(state => state.orders);
  const createBooking = useAppStore(state => state.createBooking);

  const filters = [
    { id: 'all', name: '全部房型' },
    { id: 'seaView', name: '海景房' },
    { id: 'balcony', name: '带阳台' },
    { id: 'family', name: '家庭房' },
    { id: 'cheap', name: '经济型' }
  ];

  const nights = calcNights(checkInDate, checkOutDate);

  const filteredRooms = useMemo(() => {
    return roomTypes.filter(room => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'seaView') return room.seaView;
      if (activeFilter === 'balcony') return room.balcony;
      if (activeFilter === 'family') return room.capacity >= 3;
      if (activeFilter === 'cheap') return room.price < 400;
      return true;
    });
  }, [roomTypes, activeFilter]);

  const recentOrders = useMemo(() => {
    return [...orders].reverse().slice(0, 3);
  }, [orders]);

  const handleCheckInChange = useCallback((e: any) => {
    const newDate = e.detail.value;
    setCheckInDate(newDate);
    const ci = new Date(newDate);
    const co = new Date(checkOutDate);
    if (ci >= co) {
      const nextDay = new Date(ci);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay.toISOString().split('T')[0]);
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
    setCheckOutDate(newDate);
    console.log('[Booking] 离店日期:', newDate);
  }, [checkInDate]);

  const handleRoomClick = useCallback((room: RoomType) => {
    if (room.availableCount <= 0) {
      Taro.showToast({ title: '该房型已订满', icon: 'none' });
      return;
    }
    setSelectedRoom(room);
    setDeposit(room.price >= 1000 ? 1000 : room.price >= 500 ? 500 : 200);
    setGuestCount(Math.min(2, room.capacity));
    setShowModal(true);
    console.log('[Booking] 选择房型:', room.name);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedRoom) return;
    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入客人姓名', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(guestPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (guestCount > selectedRoom.capacity) {
      Taro.showToast({ title: `该房型最多住${selectedRoom.capacity}人`, icon: 'none' });
      return;
    }

    const totalAmount = selectedRoom.price * nights;
    
    const order = createBooking({
      roomTypeId: selectedRoom.id,
      roomTypeName: selectedRoom.name,
      guestName: guestName.trim(),
      guestPhone,
      checkInDate,
      checkOutDate,
      nights,
      guestCount,
      price: selectedRoom.price,
      totalAmount,
      deposit
    });

    Taro.showToast({ title: '预订成功', icon: 'success' });
    console.log('[Booking] 生成订单:', order);
    
    setShowModal(false);
    setGuestName('');
    setGuestPhone('');
    setSelectedRoom(null);
  }, [selectedRoom, guestName, guestPhone, guestCount, checkInDate, checkOutDate, nights, deposit, createBooking]);

  useDidShow(() => {
    // 页面显示时同步状态
    const hydrate = useAppStore.getState().hydrate;
    hydrate();
    console.log('[Booking] 页面显示，当前订单数:', orders.length);
  });

  const countOptions = useMemo(() => {
    const max = selectedRoom?.capacity || 4;
    return Array.from({ length: max }, (_, i) => `${i + 1}人`);
  }, [selectedRoom]);

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>海岛民宿</Text>
          <Text className={styles.headerSubtitle}>面朝大海 · 春暖花开</Text>

          <View className={styles.dateSelector}>
            <Picker mode='date' value={checkInDate} start={new Date().toISOString().split('T')[0]} onChange={handleCheckInChange}>
              <View className={styles.dateItem}>
                <Text className={styles.label}>入住</Text>
                <Text className={styles.value}>{formatDate(checkInDate)}</Text>
              </View>
            </Picker>
            <Text className={styles.dateArrow}>→</Text>
            <Picker mode='date' value={checkOutDate} start={checkInDate} onChange={handleCheckOutChange}>
              <View className={styles.dateItem}>
                <Text className={styles.label}>离店</Text>
                <Text className={styles.value}>{formatDate(checkOutDate)}</Text>
              </View>
            </Picker>
            <View className={styles.nightsBadge}>共{nights}晚</View>
          </View>
        </View>

        <ScrollView className={styles.filterBar} scrollX>
          {filters.map(filter => (
            <View
              key={filter.id}
              className={classnames(styles.filterItem, activeFilter === filter.id && styles.active)}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.name}
            </View>
          ))}
        </ScrollView>

        <View className={styles.roomList}>
          <View className={styles.sectionTitle}>
            <Text>精选房型</Text>
            <Text className={styles.count}>共 {filteredRooms.length} 种</Text>
          </View>

          {filteredRooms.length > 0 ? (
            filteredRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
            ))
          ) : (
            <View className={styles.emptyState}>
              <View className={styles.icon}>🏝️</View>
              <Text className={styles.text}>暂无符合条件的房型</Text>
            </View>
          )}

          {recentOrders.length > 0 && (
            <View style={{ marginTop: '48rpx' }}>
              <View className={styles.sectionTitle}>
                <Text>最近预订</Text>
                <Text className={styles.count}>共 {recentOrders.length} 条</Text>
              </View>
              {recentOrders.map(order => (
                <View key={order.id} className={styles.recentOrder}>
                  <View className={styles.orderHeader}>
                    <Text className={styles.orderNo}>{order.orderNo}</Text>
                    <Text className={classnames(styles.orderStatus, styles[order.status])}>
                      已确认
                    </Text>
                  </View>
                  <View className={styles.orderInfo}>
                    <Text className={styles.roomName}>{order.roomTypeName}</Text>
                    <Text className={styles.orderDates}>
                      {order.checkInDate} ~ {order.checkOutDate}
                    </Text>
                    <Text className={styles.orderGuest}>{order.guestName} · {order.guestCount}人</Text>
                  </View>
                  <View className={styles.orderFooter}>
                    <Text className={styles.orderAmount}>
                      {formatPrice(order.totalAmount)} · 押金{formatPrice(order.deposit)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {showModal && selectedRoom && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>预订确认</Text>
              <Text className={styles.modalClose} onClick={() => setShowModal(false)}>✕</Text>
            </View>

            <ScrollView className={styles.modalContent} scrollY>
              <View className={styles.modalRoom}>
                <View className={styles.modalRoomImage}>
                  <Text style={{ fontSize: '60rpx' }}>🏖️</Text>
                </View>
                <View className={styles.modalRoomInfo}>
                  <Text className={styles.modalRoomName}>{selectedRoom.name}</Text>
                  <Text className={styles.modalRoomMeta}>
                    {selectedRoom.bedType} · {selectedRoom.size}㎡ · 可住{selectedRoom.capacity}人
                  </Text>
                  <View className={styles.modalPriceRow}>
                    <Text className={styles.modalPrice}>{formatPrice(selectedRoom.price)}</Text>
                    <Text className={styles.modalPriceUnit}>/晚 × {nights}晚</Text>
                  </View>
                </View>
              </View>

              <View className={styles.modalSection}>
                <Text className={styles.modalSectionTitle}>入住信息</Text>
                <View className={styles.modalDateRow}>
                  <View className={styles.modalDateItem}>
                    <Text className={styles.modalDateLabel}>入住</Text>
                    <Text className={styles.modalDateValue}>{checkInDate}</Text>
                  </View>
                  <Text className={styles.modalDateArrow}>→</Text>
                  <View className={styles.modalDateItem}>
                    <Text className={styles.modalDateLabel}>离店</Text>
                    <Text className={styles.modalDateValue}>{checkOutDate}</Text>
                  </View>
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
                    onInput={(e) => setGuestName(e.detail.value)}
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
                    onInput={(e) => setGuestPhone(e.detail.value)}
                    maxlength={11}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>入住人数</Text>
                  <Picker
                    mode='selector'
                    range={countOptions}
                    value={guestCount - 1}
                    onChange={(e) => setGuestCount(Number(e.detail.value) + 1)}
                  >
                    <View className={styles.formPicker}>
                      {guestCount}人
                      <Text className={styles.pickerArrow}>▼</Text>
                    </View>
                  </Picker>
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>押金</Text>
                  <View className={styles.depositRow}>
                    {[100, 200, 300, 500, 1000].filter(d => d <= selectedRoom.price).map(d => (
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
                  <Text className={styles.summaryValue}>{formatPrice(selectedRoom.price)} × {nights}晚</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>押金</Text>
                  <Text className={styles.summaryValue}>{formatPrice(deposit)}</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>合计</Text>
                  <Text className={styles.summaryTotal}>{formatPrice(selectedRoom.price * nights + deposit)}</Text>
                </View>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
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
