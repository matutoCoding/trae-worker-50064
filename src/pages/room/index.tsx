import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Button, Picker, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { getStatusText, formatDate, formatPrice } from '@/utils';
import classnames from 'classnames';
import type { Room, BookingOrder } from '@/types';

type FilterType = 'all' | 'clean' | 'dirty' | 'occupied' | 'maintenance';

interface CheckInForm {
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
}

const RoomPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BookingOrder | null>(null);
  const [checkInForm, setCheckInForm] = useState<CheckInForm>({
    guestName: '',
    guestPhone: '',
    checkInDate: formatDate(new Date()),
    checkOutDate: formatDate(new Date(Date.now() + 86400000))
  });

  const rooms = useAppStore(state => state.rooms);
  const orders = useAppStore(state => state.orders);
  const getPendingOrders = useAppStore(state => state.getPendingOrders);
  const assignRoomToOrder = useAppStore(state => state.assignRoomToOrder);
  const updateRoomStatus = useAppStore(state => state.updateRoomStatus);
  const batchCleanRooms = useAppStore(state => state.batchCleanRooms);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
  });

  const filters: { id: FilterType; name: string; icon: string }[] = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'clean', name: '空净', icon: '✨' },
    { id: 'dirty', name: '待清洁', icon: '🧹' },
    { id: 'occupied', name: '已入住', icon: '🛏️' },
    { id: 'maintenance', name: '维修中', icon: '🔧' }
  ];

  const stats = useMemo(() => {
    const total = rooms.length;
    const clean = rooms.filter(r => r.status === 'clean').length;
    const dirty = rooms.filter(r => r.status === 'dirty').length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;
    return { total, clean, dirty, occupied, maintenance };
  }, [rooms]);

  const pendingOrders = useMemo(() => getPendingOrders(), [orders, rooms, getPendingOrders]);

  const filterCounts = useMemo(() => {
    return {
      all: rooms.length,
      clean: rooms.filter(r => r.status === 'clean').length,
      dirty: rooms.filter(r => r.status === 'dirty').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms;
    return rooms.filter(r => r.status === filter);
  }, [rooms, filter]);

  const availableRoomsForAssign = useMemo(() => {
    if (!selectedOrder) return [];
    return rooms.filter(r => r.status === 'clean' && r.typeId === selectedOrder.roomTypeId);
  }, [selectedOrder, rooms]);

  const handleAssignClick = useCallback((order: BookingOrder) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  }, []);

  const handleConfirmAssign = useCallback((roomId: string) => {
    if (!selectedOrder) return;
    const success = assignRoomToOrder(selectedOrder.id, roomId);
    if (success) {
      const room = rooms.find(r => r.id === roomId);
      Taro.showToast({
        title: `已分配 ${room?.roomNumber}`,
        icon: 'success'
      });
      setShowAssignModal(false);
      setSelectedOrder(null);
    } else {
      Taro.showToast({
        title: '排房失败，请重试',
        icon: 'none'
      });
    }
  }, [selectedOrder, assignRoomToOrder, rooms]);

  const handleCleanComplete = useCallback((roomId: string) => {
    updateRoomStatus(roomId, 'clean');
    Taro.showToast({ title: '清洁完成', icon: 'success' });
  }, [updateRoomStatus]);

  const handleCheckInClick = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
    setCheckInForm({
      guestName: '',
      guestPhone: '',
      checkInDate: formatDate(new Date()),
      checkOutDate: formatDate(new Date(Date.now() + 86400000))
    });
    setShowCheckInModal(true);
  }, []);

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

  const handleCheckout = useCallback((roomId: string) => {
    Taro.showModal({
      title: '确认退房',
      content: '确定标记该房间为退房吗？退房后房间状态将变为待清洁。',
      success: res => {
        if (res.confirm) {
          updateRoomStatus(roomId, 'dirty');
          Taro.showToast({ title: '已退房', icon: 'success' });
        }
      }
    });
  }, [updateRoomStatus]);

  const handleMarkMaintenance = useCallback((roomId: string) => {
    Taro.showModal({
      title: '标记维修',
      content: '确定将该房间标记为维修中吗？',
      success: res => {
        if (res.confirm) {
          updateRoomStatus(roomId, 'maintenance');
          Taro.showToast({ title: '已标记维修', icon: 'success' });
        }
      }
    });
  }, [updateRoomStatus]);

  const handleCancelMaintenance = useCallback((roomId: string) => {
    updateRoomStatus(roomId, 'clean');
    Taro.showToast({ title: '已取消维修', icon: 'success' });
  }, [updateRoomStatus]);

  const handleRoomClick = useCallback((room: Room) => {
    Taro.showModal({
      title: `房间 ${room.roomNumber}`,
      content: `房型: ${room.typeName}\n楼层: ${room.floor}楼\n状态: ${getStatusText(room.status, 'room')}${room.guestName ? `\n客人: ${room.guestName}\n电话: ${room.guestPhone}\n入住: ${room.checkInDate} ~ ${room.checkOutDate}` : ''}`,
      showCancel: false
    });
  }, []);

  const handleBatchClean = useCallback(() => {
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

  const renderRoomActions = (room: Room) => {
    const actionButtons: React.ReactNode[] = [];

    if (room.status === 'clean') {
      actionButtons.push(
        <Button
          key='checkin'
          className={classnames(styles.roomActionBtn, styles.primaryBtn)}
          onClick={(e) => { e.stopPropagation(); handleCheckInClick(room.id); }}
        >
          安排入住
        </Button>
      );
      actionButtons.push(
        <Button
          key='maintenance'
          className={classnames(styles.roomActionBtn, styles.warningBtn)}
          onClick={(e) => { e.stopPropagation(); handleMarkMaintenance(room.id); }}
        >
          标记维修
        </Button>
      );
    } else if (room.status === 'dirty') {
      actionButtons.push(
        <Button
          key='clean'
          className={classnames(styles.roomActionBtn, styles.successBtn)}
          onClick={(e) => { e.stopPropagation(); handleCleanComplete(room.id); }}
        >
          清洁完成
        </Button>
      );
      actionButtons.push(
        <Button
          key='maintenance'
          className={classnames(styles.roomActionBtn, styles.warningBtn)}
          onClick={(e) => { e.stopPropagation(); handleMarkMaintenance(room.id); }}
        >
          标记维修
        </Button>
      );
    } else if (room.status === 'occupied') {
      actionButtons.push(
        <Button
          key='checkout'
          className={classnames(styles.roomActionBtn, styles.dangerBtn)}
          onClick={(e) => { e.stopPropagation(); handleCheckout(room.id); }}
        >
          标记退房
        </Button>
      );
    } else if (room.status === 'maintenance') {
      actionButtons.push(
        <Button
          key='cancel'
          className={classnames(styles.roomActionBtn, styles.primaryBtn)}
          onClick={(e) => { e.stopPropagation(); handleCancelMaintenance(room.id); }}
        >
          取消维修
        </Button>
      );
    }

    return actionButtons;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>当天排房视图</Text>
        <View className={styles.statsGrid}>
          <View className={classnames(styles.statCard, styles.statClean)}>
            <Text className={styles.statIcon}>✨</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.clean}</Text>
              <Text className={styles.statLabel}>空净房</Text>
            </View>
          </View>
          <View className={classnames(styles.statCard, styles.statDirty)}>
            <Text className={styles.statIcon}>🧹</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.dirty}</Text>
              <Text className={styles.statLabel}>待清洁</Text>
            </View>
          </View>
          <View className={classnames(styles.statCard, styles.statOccupied)}>
            <Text className={styles.statIcon}>🛏️</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.occupied}</Text>
              <Text className={styles.statLabel}>已入住</Text>
            </View>
          </View>
          <View className={classnames(styles.statCard, styles.statMaintenance)}>
            <Text className={styles.statIcon}>🔧</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.maintenance}</Text>
              <Text className={styles.statLabel}>维修中</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className={styles.pageContent} scrollY>
        <View className={styles.pendingOrdersSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📋 今日待入住订单</Text>
            <View className={styles.badge}>{pendingOrders.length}</View>
          </View>
          {pendingOrders.length > 0 ? (
            <View className={styles.pendingOrdersList}>
              {pendingOrders.map(order => (
                <View key={order.id} className={styles.orderCard}>
                  <View className={styles.orderHeader}>
                    <Text className={styles.orderNo}>{order.orderNo}</Text>
                    <View className={styles.orderStatus}>{getStatusText(order.status, 'order')}</View>
                  </View>
                  <View className={styles.orderBody}>
                    <View className={styles.orderRow}>
                      <Text className={styles.orderLabel}>客人</Text>
                      <Text className={styles.orderValue}>{order.guestName} · {order.guestPhone}</Text>
                    </View>
                    <View className={styles.orderRow}>
                      <Text className={styles.orderLabel}>房型</Text>
                      <Text className={styles.orderValue}>{order.roomTypeName}</Text>
                    </View>
                    <View className={styles.orderRow}>
                      <Text className={styles.orderLabel}>入住</Text>
                      <Text className={styles.orderValue}>{order.checkInDate} ~ {order.checkOutDate} ({order.nights}晚)</Text>
                    </View>
                    <View className={styles.orderRow}>
                      <Text className={styles.orderLabel}>人数</Text>
                      <Text className={styles.orderValue}>{order.guestCount}人</Text>
                    </View>
                    <View className={styles.orderRow}>
                      <Text className={styles.orderLabel}>总价</Text>
                      <Text className={styles.orderPrice}>{formatPrice(order.totalAmount)}</Text>
                    </View>
                  </View>
                  <View className={styles.orderFooter}>
                    <Button
                      className={styles.assignBtn}
                      onClick={() => handleAssignClick(order)}
                    >
                      分配房号
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🎉</Text>
              <Text className={styles.emptyText}>今日暂无待入住订单</Text>
            </View>
          )}
        </View>

        <ScrollView className={styles.filterTabs} scrollX>
          {filters.map(f => (
            <View
              key={f.id}
              className={classnames(styles.tabItem, filter === f.id && styles.active)}
              onClick={() => setFilter(f.id)}
            >
              <Text className={styles.tabIcon}>{f.icon}</Text>
              <Text className={styles.tabName}>{f.name}</Text>
              <Text className={styles.count}>{filterCounts[f.id]}</Text>
            </View>
          ))}
        </ScrollView>

        <View className={styles.roomGrid}>
          {filteredRooms.length > 0 ? (
            filteredRooms.map(room => (
              <View
                key={room.id}
                className={classnames(styles.roomCard, styles[`status${room.status.charAt(0).toUpperCase() + room.status.slice(1)}`])}
                onClick={() => handleRoomClick(room)}
              >
                <View className={styles.roomHeader}>
                  <Text className={styles.roomNumber}>{room.roomNumber}</Text>
                  <View className={classnames(styles.roomStatus, styles[room.status])}>
                    {getStatusText(room.status, 'room')}
                  </View>
                </View>
                <Text className={styles.roomType}>{room.typeName} · {room.floor}楼</Text>
                {room.guestName && (
                  <View className={styles.guestInfo}>
                    <Text className={styles.guestName}>👤 {room.guestName}</Text>
                    <Text className={styles.guestDate}>📅 {room.checkInDate} ~ {room.checkOutDate}</Text>
                  </View>
                )}
                <View className={styles.roomActions}>
                  {renderRoomActions(room)}
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🏠</Text>
              <Text className={styles.emptyText}>暂无符合条件的房间</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className={styles.actionBar}>
        <Button
          className={classnames(styles.actionBtn, styles.primary)}
          onClick={handleBatchClean}
        >
          🧹 一键批量清洁 ({stats.dirty})
        </Button>
      </View>

      {showCheckInModal && (
        <View className={styles.modalMask} onClick={() => setShowCheckInModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>入住登记</Text>
              <Text className={styles.modalClose} onClick={() => setShowCheckInModal(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>客人姓名 *</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入客人姓名'
                  value={checkInForm.guestName}
                  onInput={e => setCheckInForm({ ...checkInForm, guestName: e.detail.value })}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>联系电话 *</Text>
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

      {showAssignModal && selectedOrder && (
        <View className={styles.modalMask} onClick={() => { setShowAssignModal(false); setSelectedOrder(null); }}>
          <View className={classnames(styles.modal, styles.assignModal)} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <View>
                <Text className={styles.modalTitle}>分配房号</Text>
                <Text className={styles.modalSubtitle}>{selectedOrder.roomTypeName} · 共 {availableRoomsForAssign.length} 间空净</Text>
              </View>
              <Text className={styles.modalClose} onClick={() => { setShowAssignModal(false); setSelectedOrder(null); }}>×</Text>
            </View>
            <View className={styles.orderSummary}>
              <Text className={styles.orderSummaryText}>
                {selectedOrder.guestName} · {selectedOrder.checkInDate} ~ {selectedOrder.checkOutDate}
              </Text>
            </View>
            <ScrollView className={styles.roomPickerList} scrollY>
              {availableRoomsForAssign.length > 0 ? (
                availableRoomsForAssign.map(room => (
                  <View
                    key={room.id}
                    className={styles.roomPickerItem}
                    onClick={() => handleConfirmAssign(room.id)}
                  >
                    <View className={styles.roomPickerInfo}>
                      <Text className={styles.roomPickerNumber}>{room.roomNumber}</Text>
                      <Text className={styles.roomPickerDetail}>{room.typeName} · {room.floor}楼</Text>
                    </View>
                    <Text className={styles.roomPickerArrow}>→</Text>
                  </View>
                ))
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>😔</Text>
                  <Text className={styles.emptyText}>暂无可分配的空净房间</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default RoomPage;
