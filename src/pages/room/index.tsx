import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { rooms } from '@/data/orders';
import { getStatusText } from '@/utils';
import classnames from 'classnames';

type FilterType = 'all' | 'clean' | 'dirty' | 'occupied' | 'maintenance';

const RoomPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filters: { id: FilterType; name: string }[] = [
    { id: 'all', name: '全部' },
    { id: 'clean', name: '干净' },
    { id: 'dirty', name: '待清洁' },
    { id: 'occupied', name: '已入住' },
    { id: 'maintenance', name: '维修中' }
  ];

  const stats = useMemo(() => {
    const total = rooms.length;
    const clean = rooms.filter(r => r.status === 'clean').length;
    const dirty = rooms.filter(r => r.status === 'dirty').length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    return { total, clean, dirty, occupied };
  }, []);

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms;
    return rooms.filter(r => r.status === filter);
  }, [filter]);

  const roomsByFloor = useMemo(() => {
    const map: Record<number, typeof rooms> = {};
    filteredRooms.forEach(room => {
      if (!map[room.floor]) {
        map[room.floor] = [];
      }
      map[room.floor].push(room);
    });
    return map;
  }, [filteredRooms]);

  const handleRoomClick = useCallback((roomId: string) => {
    console.log('[Room] 点击房间:', roomId);
    Taro.showActionSheet({
      itemList: ['查看详情', '清洁完成', '安排入住', '标记维修'],
      success: res => {
        console.log('[Room] 操作选择:', res.tapIndex);
        Taro.showToast({
          title: '操作成功',
          icon: 'success'
        });
      },
      fail: err => {
        console.error('[Room] 操作失败:', err);
      }
    });
  }, []);

  const handleBatchClean = useCallback(() => {
    console.log('[Room] 批量清洁');
    Taro.showToast({
      title: '已安排清洁',
      icon: 'success'
    });
  }, []);

  const handleBatchCheckout = useCallback(() => {
    console.log('[Room] 批量退房');
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }, []);

  const filterCounts = useMemo(() => {
    return {
      all: rooms.length,
      clean: rooms.filter(r => r.status === 'clean').length,
      dirty: rooms.filter(r => r.status === 'dirty').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length
    };
  }, []);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>房间管理</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.total}</Text>
            <Text className={styles.label}>总房间</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.occupied}</Text>
            <Text className={styles.label}>已入住</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.clean}</Text>
            <Text className={styles.label}>可售房</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.dirty}</Text>
            <Text className={styles.label}>待清洁</Text>
          </View>
        </View>
      </View>

      <ScrollView className={styles.filterTabs} scrollX>
        {filters.map(f => (
          <View
            key={f.id}
            className={classnames(styles.tabItem, filter === f.id && styles.active)}
            onClick={() => setFilter(f.id)}
          >
            {f.name}
            <Text className={styles.count}>{filterCounts[f.id]}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView className={styles.pageContent} scrollY>
        <View className={styles.roomGrid}>
          {Object.keys(roomsByFloor).length > 0 ? (
            Object.keys(roomsByFloor)
              .sort((a, b) => Number(a) - Number(b))
              .map(floor => (
                <View key={floor} className={styles.floorSection}>
                  <Text className={styles.floorTitle}>{floor}楼</Text>
                  <View className={styles.roomGridList}>
                    {roomsByFloor[Number(floor)].map(room => (
                      <View
                        key={room.id}
                        className={classnames(styles.roomCard, styles[`status${room.status.charAt(0).toUpperCase() + room.status.slice(1)}`])}
                        onClick={() => handleRoomClick(room.id)}
                      >
                        <Text className={styles.roomNumber}>{room.roomNumber}</Text>
                        <Text className={styles.roomType}>{room.typeName}</Text>
                        <View className={classnames(styles.roomStatus, styles[room.status])}>
                          {getStatusText(room.status, 'room')}
                        </View>
                        {room.guestName && (
                          <>
                            <Text className={styles.roomGuest}>{room.guestName}</Text>
                            <Text className={styles.roomDate}>
                              {room.checkInDate} ~ {room.checkOutDate}
                            </Text>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))
          ) : (
            <View style={{ textAlign: 'center', padding: '80rpx 0', color: '#8aa3bd' }}>
              <Text style={{ fontSize: '60rpx' }}>🏠</Text>
              <Text style={{ marginTop: '16rpx' }}>暂无符合条件的房间</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className={styles.actionBar}>
        <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleBatchCheckout}>
          批量退房
        </Button>
        <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleBatchClean}>
          安排清洁
        </Button>
      </View>
    </View>
  );
};

export default RoomPage;
