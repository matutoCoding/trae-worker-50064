import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RoomCard from '@/components/RoomCard';
import { roomTypes } from '@/data/rooms';
import { formatDate, formatDateCN, calcNights } from '@/utils';
import classnames from 'classnames';

const BookingPage: React.FC = () => {
  const [checkInDate, setCheckInDate] = useState<string>('2026-06-17');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-06-20');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', name: '全部房型' },
    { id: 'seaView', name: '海景房' },
    { id: 'balcony', name: '带阳台' },
    { id: 'family', name: '家庭房' },
    { id: 'cheap', name: '经济型' }
  ];

  const nights = calcNights(checkInDate, checkOutDate);

  const filteredRooms = roomTypes.filter(room => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'seaView') return room.seaView;
    if (activeFilter === 'balcony') return room.balcony;
    if (activeFilter === 'family') return room.capacity >= 3;
    if (activeFilter === 'cheap') return room.price < 400;
    return true;
  });

  const handleRoomClick = useCallback((roomId: string) => {
    console.log('[Booking] 点击房型:', roomId);
    Taro.showToast({
      title: '预订功能开发中',
      icon: 'none'
    });
  }, []);

  const handleDateChange = useCallback((type: 'checkIn' | 'checkOut') => {
    console.log('[Booking] 修改日期:', type);
    Taro.showToast({
      title: '日期选择开发中',
      icon: 'none'
    });
  }, []);

  useDidShow(() => {
    console.log('[Booking] 页面显示');
  });

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>海岛民宿</Text>
        <Text className={styles.headerSubtitle}>面朝大海 · 春暖花开</Text>

        <View className={styles.dateSelector}>
          <View className={styles.dateItem} onClick={() => handleDateChange('checkIn')}>
            <Text className={styles.label}>入住</Text>
            <Text className={styles.value}>{formatDate(checkInDate)}</Text>
          </View>
          <Text className={styles.dateArrow}>→</Text>
          <View className={styles.dateItem} onClick={() => handleDateChange('checkOut')}>
            <Text className={styles.label}>离店</Text>
            <Text className={styles.value}>{formatDate(checkOutDate)}</Text>
          </View>
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
            <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room.id)} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.icon}>🏝️</View>
            <Text className={styles.text}>暂无符合条件的房型</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default BookingPage;
