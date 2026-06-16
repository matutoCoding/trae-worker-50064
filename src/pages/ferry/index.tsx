import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Picker, Input, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { getStatusText, formatPrice, formatDate } from '@/utils';
import classnames from 'classnames';

type DirectionType = 'go' | 'back';
type BookingType = 'ferry' | 'shuttle' | null;

interface ShuttleBooking {
  id: string;
  ferryId: string;
  ferryName: string;
  guestName: string;
  guestPhone: string;
  bookingTime: string;
}

const FerryPage: React.FC = () => {
  const [direction, setDirection] = useState<DirectionType>('go');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState<BookingType>(null);
  const [selectedFerryId, setSelectedFerryId] = useState<string | null>(null);
  const [selectedShuttleId, setSelectedShuttleId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestPhone: '',
    seats: 1
  });
  const [myBookings, setMyBookings] = useState<ShuttleBooking[]>([]);

  const ferries = useAppStore(state => state.ferries);
  const shuttles = useAppStore(state => state.shuttles);
  const bookFerry = useAppStore(state => state.bookFerry);
  const bookShuttle = useAppStore(state => state.bookShuttle);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
    const stored = Taro.getStorageSync('ferry_bookings');
    if (stored) {
      setMyBookings(JSON.parse(stored));
    }
  });

  const filteredFerries = useMemo(() => {
    return ferries.filter(f => {
      if (direction === 'go') {
        return f.departure.includes('市区') && f.date === selectedDate;
      } else {
        return f.departure.includes('海岛') && f.date === selectedDate;
      }
    });
  }, [direction, selectedDate, ferries]);

  const handleFerryClick = useCallback((ferryId: string) => {
    console.log('[Ferry] 点击船班:', ferryId);
    const ferry = ferries.find(f => f.id === ferryId);
    if (!ferry) return;

    const itemList = ['查看详情'];
    if (ferry.status !== 'cancelled' && ferry.availableSeats > 0) {
      itemList.unshift('预订船票', '预约接驳');
    }

    Taro.showActionSheet({
      itemList,
      success: res => {
        const action = itemList[res.tapIndex];
        console.log('[Ferry] 操作选择:', action);

        if (action === '预订船票') {
          if (ferry.status === 'cancelled') {
            Taro.showToast({ title: '该船班已取消', icon: 'none' });
            return;
          }
          if (ferry.availableSeats <= 0) {
            Taro.showToast({ title: '该船班已售罄', icon: 'none' });
            return;
          }
          setSelectedFerryId(ferryId);
          setSelectedShuttleId(null);
          setBookingType('ferry');
          setBookingForm({ guestName: '', guestPhone: '', seats: 1 });
          setShowBookingModal(true);
        } else if (action === '预约接驳') {
          const matchedShuttle = shuttles.find(s => s.ferryName.includes(ferry.route));
          if (matchedShuttle) {
            if (matchedShuttle.bookedCount >= matchedShuttle.capacity) {
              Taro.showToast({ title: '该接驳已满员', icon: 'none' });
              return;
            }
            setSelectedShuttleId(matchedShuttle.id);
            setSelectedFerryId(null);
            setBookingType('shuttle');
            setBookingForm({ guestName: '', guestPhone: '', seats: 1 });
            setShowBookingModal(true);
          } else {
            Taro.showToast({ title: '暂无可用接驳', icon: 'none' });
          }
        } else if (action === '查看详情') {
          Taro.showModal({
            title: ferry.route,
            content: `日期: ${ferry.date}\n出发: ${ferry.departureTime} ${ferry.departure}\n到达: ${ferry.arrivalTime} ${ferry.arrival}\n票价: ${formatPrice(ferry.price)}/人\n剩余座位: ${ferry.availableSeats}\n状态: ${getStatusText(ferry.status, 'ferry')}`,
            showCancel: false
          });
        }
      },
      fail: err => {
        console.error('[Ferry] 操作失败:', err);
      }
    });
  }, [ferries, shuttles]);

  const handleShuttleBook = useCallback((shuttleId: string) => {
    console.log('[Ferry] 预约接驳:', shuttleId);
    const shuttle = shuttles.find(s => s.id === shuttleId);
    if (!shuttle) return;

    if (shuttle.bookedCount >= shuttle.capacity) {
      Taro.showToast({ title: '该接驳已满员', icon: 'none' });
      return;
    }

    setSelectedShuttleId(shuttleId);
    setSelectedFerryId(null);
    setBookingType('shuttle');
    setBookingForm({ guestName: '', guestPhone: '', seats: 1 });
    setShowBookingModal(true);
  }, [shuttles]);

  const handleBookingSubmit = useCallback(() => {
    if (!bookingForm.guestName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!bookingForm.guestPhone.trim()) {
      Taro.showToast({ title: '请输入电话', icon: 'none' });
      return;
    }

    let success = false;
    let bookingName = '';

    if (bookingType === 'ferry' && selectedFerryId) {
      const ferry = ferries.find(f => f.id === selectedFerryId);
      if (ferry && ferry.availableSeats >= bookingForm.seats) {
        success = bookFerry(selectedFerryId, bookingForm.seats);
        bookingName = ferry.route;
      } else {
        Taro.showToast({ title: '座位不足', icon: 'none' });
        return;
      }
    } else if (bookingType === 'shuttle' && selectedShuttleId) {
      const shuttle = shuttles.find(s => s.id === selectedShuttleId);
      if (shuttle && shuttle.capacity - shuttle.bookedCount >= bookingForm.seats) {
        success = bookShuttle(selectedShuttleId, bookingForm.seats);
        bookingName = shuttle.ferryName;
      } else {
        Taro.showToast({ title: '名额不足', icon: 'none' });
        return;
      }
    }

    if (success) {
      const newBooking: ShuttleBooking = {
        id: Math.random().toString(36).substring(2, 10),
        ferryId: selectedFerryId || selectedShuttleId || '',
        ferryName: bookingName,
        guestName: bookingForm.guestName,
        guestPhone: bookingForm.guestPhone,
        bookingTime: new Date().toLocaleString('zh-CN')
      };
      const updatedBookings = [...myBookings, newBooking];
      setMyBookings(updatedBookings);
      Taro.setStorageSync('ferry_bookings', JSON.stringify(updatedBookings));

      setShowBookingModal(false);
      setBookingType(null);
      setSelectedFerryId(null);
      setSelectedShuttleId(null);
      Taro.showToast({ title: '预订成功', icon: 'success' });
    } else {
      Taro.showToast({ title: '预订失败', icon: 'none' });
    }
  }, [bookingType, selectedFerryId, selectedShuttleId, bookingForm, ferries, shuttles, bookFerry, bookShuttle, myBookings]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>船班接驳</Text>
        <Text className={styles.headerSubtitle}>轮渡班次查询 · 上岛接送安排</Text>
        <Picker
          mode='date'
          value={selectedDate}
          onChange={e => setSelectedDate(e.detail.value)}
        >
          <View className={styles.dateSelector}>
            <Text className={styles.dateIcon}>📅</Text>
            <Text className={styles.dateText}>{selectedDate}</Text>
            <Text className={styles.dateIcon}>▼</Text>
          </View>
        </Picker>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, direction === 'go' && styles.active)}
          onClick={() => setDirection('go')}
        >
          上岛
        </View>
        <View
          className={classnames(styles.tabItem, direction === 'back' && styles.active)}
          onClick={() => setDirection('back')}
        >
          离岛
        </View>
      </View>

      <View className={styles.ferryList}>
        {filteredFerries.length > 0 ? (
          filteredFerries.map(ferry => (
            <View
              key={ferry.id}
              className={styles.ferryCard}
              onClick={() => handleFerryClick(ferry.id)}
            >
              <View className={styles.ferryHeader}>
                <Text className={styles.ferryRoute}>{ferry.route}</Text>
                <View className={classnames(styles.ferryStatus, styles[ferry.status])}>
                  {getStatusText(ferry.status, 'ferry')}
                </View>
              </View>

              <View className={styles.ferryTime}>
                <View className={styles.timeBlock}>
                  <Text className={styles.time}>{ferry.departureTime}</Text>
                  <Text className={styles.port}>{ferry.departure}</Text>
                </View>
                <View className={styles.timeArrow}>─ ⛴️ ─</View>
                <View className={styles.timeBlock}>
                  <Text className={styles.time}>{ferry.arrivalTime}</Text>
                  <Text className={styles.port}>{ferry.arrival}</Text>
                </View>
              </View>

              <View className={styles.ferryFooter}>
                <View className={styles.priceWrap}>
                  <Text className={styles.price}>{formatPrice(ferry.price)}</Text>
                  <Text className={styles.unit}>/人</Text>
                </View>
                <View className={styles.seatsInfo}>
                  {ferry.availableSeats > 0 ? (
                    <Text className={styles.available}>剩余 {ferry.availableSeats} 座</Text>
                  ) : (
                    <Text className={styles.full}>已售罄</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.icon}>⛴️</View>
            <Text className={styles.text}>暂无{direction === 'go' ? '上岛' : '离岛'}船班</Text>
          </View>
        )}

        <View className={styles.shuttleSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.icon}>🚐</Text>
            <Text>接驳安排</Text>
          </View>

          {shuttles.map(shuttle => (
            <View
              key={shuttle.id}
              className={styles.shuttleCard}
              onClick={() => handleShuttleBook(shuttle.id)}
            >
              <View className={styles.shuttleIcon}>🚐</View>
              <View className={styles.shuttleInfo}>
                <Text className={styles.shuttleTitle}>{shuttle.ferryName}</Text>
                <Text className={styles.shuttleDesc}>
                  {shuttle.pickupTime} {shuttle.pickupPoint} → {shuttle.dropoffPoint}
                </Text>
                <Text className={styles.shuttleDesc}>
                  {shuttle.vehicle} · {shuttle.driver}
                </Text>
              </View>
              <Text className={classnames(styles.shuttleSeats, shuttle.bookedCount >= shuttle.capacity && styles.full)}>
                {shuttle.bookedCount}/{shuttle.capacity}座
              </Text>
            </View>
          ))}
        </View>

        {myBookings.length > 0 && (
          <View className={styles.shuttleSection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.icon}>📋</Text>
              <Text>我的接驳安排</Text>
            </View>

            {myBookings.map(booking => (
              <View key={booking.id} className={styles.shuttleCard}>
                <View className={styles.shuttleIcon}>✅</View>
                <View className={styles.shuttleInfo}>
                  <Text className={styles.shuttleTitle}>{booking.ferryName}</Text>
                  <Text className={styles.shuttleDesc}>
                    客人: {booking.guestName} · {booking.guestPhone}
                  </Text>
                  <Text className={styles.shuttleDesc}>
                    预订时间: {booking.bookingTime}
                  </Text>
                </View>
                <Text className={styles.shuttleSeats}>已确认</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {showBookingModal && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {bookingType === 'ferry' ? '预订船票' : '预约接驳'}
              </Text>
              <Text className={styles.modalClose} onClick={() => setShowBookingModal(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入姓名'
                  value={bookingForm.guestName}
                  onInput={e => setBookingForm({ ...bookingForm, guestName: e.detail.value })}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>电话</Text>
                <Input
                  className={styles.formInput}
                  type='number'
                  placeholder='请输入电话'
                  value={bookingForm.guestPhone}
                  onInput={e => setBookingForm({ ...bookingForm, guestPhone: e.detail.value })}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>人数</Text>
                <View className={styles.seatsSelector}>
                  <Button
                    className={styles.seatsBtn}
                    onClick={() => setBookingForm({ ...bookingForm, seats: Math.max(1, bookingForm.seats - 1) })}
                  >-</Button>
                  <Text className={styles.seatsCount}>{bookingForm.seats}</Text>
                  <Button
                    className={styles.seatsBtn}
                    onClick={() => setBookingForm({ ...bookingForm, seats: Math.min(10, bookingForm.seats + 1) })}
                  >+</Button>
                </View>
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnCancel} onClick={() => setShowBookingModal(false)}>取消</Button>
              <Button className={styles.modalBtnConfirm} onClick={handleBookingSubmit}>确认预订</Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FerryPage;
