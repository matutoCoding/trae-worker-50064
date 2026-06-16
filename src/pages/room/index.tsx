import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Button, Picker, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { getStatusText, formatDate } from '@/utils';
import classnames from 'classnames';

type FilterType = 'all' | 'clean' | 'dirty' | 'occupied' | 'maintenance';

const RoomPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [checkInForm, setCheckInForm] = useState({
    guestName: '',
    guestPhone: '',
    checkInDate: formatDate(new Date()),
    checkOutDate: formatDate(new Date(Date.now() + 86400000))
  });

  const rooms = useAppStore(state => state.rooms);
  const updateRoomStatus = useAppStore(state => state.updateRoomStatus);
  const batchCleanRooms = useAppStore(state => state.batchCleanRooms);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
  });

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
  }, [rooms]);

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
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const itemList = ['查看详情'];
    if (room.status === 'dirty') itemList.push('清洁完成');
    if (room.status === 'clean') itemList.push('安排入住');
    if (room.status !== 'maintenance') itemList.push('标记维修');
    if (room.status === 'maintenance') itemList.push('取消维修');

    Taro.showActionSheet({
      itemList,
      success: res => {
        const action = itemList[res.tapIndex];
        console.log('[Room] 操作选择:', action);

        if (action === '清洁完成') {
          updateRoomStatus(roomId, 'clean');
          Taro.showToast({ title: '已标记为干净', icon: 'success' });
        } else if (action === '安排入住') {
          setSelectedRoomId(roomId);
          setCheckInForm({
            guestName: '',
            guestPhone: '',
            checkInDate: formatDate(new Date()),
            checkOutDate: formatDate(new Date(Date.now() + 86400000))
          });
          setShowCheckInModal(true);
        } else if (action === '标记维修') {
          updateRoomStatus(roomId, 'maintenance');
          Taro.showToast({ title: '已标记维修', icon: 'success' });
        } else if (action === '取消维修') {
          updateRoomStatus(roomId, 'clean');
          Taro.showToast({ title: '已取消维修', icon: 'success' });
        } else if (action === '查看详情') {
          Taro.showModal({
            title: `房间 ${room.roomNumber}`,
            content: `房型: ${room.typeName}\n状态: ${getStatusText(room.status, 'room')}${room.guestName ? `\n客人: ${room.guestName}\n入住: ${room.checkInDate} ~ ${room.checkOutDate}` : ''}`,
            showCancel: false
          });
        }
      },
      fail: err => {
        console.error('[Room] 操作失败:', err);
      }
    });
  }, [rooms, updateRoomStatus]);

  const handleCheckInSubmit = useCallback(() => {
    if (!checkInForm.guestName.trim()) {
      Taro.showToast({ title: '请输入客人姓名', icon: 'none' });
      return;
    }
    if (!checkInForm.guestPhone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!selectedRoomId) return;

    updateRoomStatus(selectedRoomId, 'occupied', checkInForm);
    setShowCheckInModal(false);
    setSelectedRoomId(null);
    Taro.showToast({ title: '入住登记成功', icon: 'success' });
  }, [selectedRoomId, checkInForm, updateRoomStatus]);

  const handleBatchClean = useCallback(() => {
    console.log('[Room] 批量清洁');
    const dirtyRoomIds = rooms.filter(r => r.status === 'dirty').map(r => r.id);
    if (dirtyRoomIds.length === 0) {
      Taro.showToast({ title: '没有待清洁房间', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '批量清洁',
      content: `确定将 ${dirtyRoomIds.length} 个待清洁房间标记为干净吗？`,
      success: res => {
        if (res.confirm) {
          batchCleanRooms(dirtyRoomIds);
          Taro.showToast({ title: `已清洁 ${dirtyRoomIds.length} 间`, icon: 'success' });
        }
      }
    });
  }, [rooms, batchCleanRooms]);

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
  }, [rooms]);

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

      {showCheckInModal && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>入住登记</Text>
              <Text className={styles.modalClose} onClick={() => setShowCheckInModal(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>客人姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入客人姓名'
                  value={checkInForm.guestName}
                  onInput={e => setCheckInForm({ ...checkInForm, guestName: e.detail.value })}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>联系电话</Text>
                <Input
                  className={styles.formInput}
                  type='number'
                  placeholder='请输入联系电话'
                  value={checkInForm.guestPhone}
                  onInput={e => setCheckInForm({ ...checkInForm, guestPhone: e.detail.value })}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>入住日期</Text>
                <Picker
                  mode='date'
                  value={checkInForm.checkInDate}
                  onChange={e => setCheckInForm({ ...checkInForm, checkInDate: e.detail.value })}
                >
                  <View className={styles.pickerText}>{checkInForm.checkInDate || '请选择'}</View>
                </Picker>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>离店日期</Text>
                <Picker
                  mode='date'
                  value={checkInForm.checkOutDate}
                  onChange={e => setCheckInForm({ ...checkInForm, checkOutDate: e.detail.value })}
                >
                  <View className={styles.pickerText}>{checkInForm.checkOutDate || '请选择'}</View>
                </Picker>
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnCancel} onClick={() => setShowCheckInModal(false)}>取消</Button>
              <Button className={styles.modalBtnConfirm} onClick={handleCheckInSubmit}>确认入住</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default RoomPage;
