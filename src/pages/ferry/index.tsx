import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { ferries, shuttles } from '@/data/ferries';
import { getStatusText, formatPrice } from '@/utils';
import classnames from 'classnames';

type DirectionType = 'go' | 'back';

const FerryPage: React.FC = () => {
  const [direction, setDirection] = useState<DirectionType>('go');
  const [selectedDate, setSelectedDate] = useState('2026-06-17');

  const filteredFerries = useMemo(() => {
    return ferries.filter(f => {
      if (direction === 'go') {
        return f.departure.includes('市区') && f.date === selectedDate;
      } else {
        return f.departure.includes('海岛') && f.date === selectedDate;
      }
    });
  }, [direction, selectedDate]);

  const handleFerryClick = useCallback((ferryId: string) => {
    console.log('[Ferry] 点击船班:', ferryId);
    Taro.showActionSheet({
      itemList: ['预订船票', '预约接驳', '查看详情'],
      success: res => {
        Taro.showToast({
          title: '操作成功',
          icon: 'success'
        });
      },
      fail: err => {
        console.error('[Ferry] 操作失败:', err);
      }
    });
  }, []);

  const handleDateChange = useCallback(() => {
    console.log('[Ferry] 修改日期');
    Taro.showToast({
      title: '日期选择开发中',
      icon: 'none'
    });
  }, []);

  const handleShuttleBook = useCallback((shuttleId: string) => {
    console.log('[Ferry] 预约接驳:', shuttleId);
    Taro.showToast({
      title: '预约成功',
      icon: 'success'
    });
  }, []);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>船班接驳</Text>
        <Text className={styles.headerSubtitle}>轮渡班次查询 · 上岛接送安排</Text>
        <View className={styles.dateSelector} onClick={handleDateChange}>
          <Text className={styles.dateIcon}>📅</Text>
          <Text className={styles.dateText}>{selectedDate}</Text>
          <Text className={styles.dateIcon}>▼</Text>
        </View>
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
              <Text className={styles.shuttleSeats}>
                {shuttle.bookedCount}/{shuttle.capacity}座
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default FerryPage;
