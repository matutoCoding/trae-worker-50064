import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Picker, Input, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { getStatusText, formatPrice, formatDate } from '@/utils';
import classnames from 'classnames';
import type { Ferry, Shuttle, ShuttleBooking as ShuttleBookingType } from '@/types';

type TabType = 'ferry' | 'shuttle';
type BookingType = 'ferry' | 'shuttle' | 'both';

interface BookingFormData {
  guestName: string;
  guestPhone: string;
  passengers: number;
  type: BookingType;
}

const TYPE_LABELS: Record<BookingType, string> = {
  ferry: '仅船票',
  shuttle: '仅接驳',
  both: '船票+接驳'
};

const BOOKING_TYPE_LABELS: Record<'ferry' | 'shuttle' | 'both', string> = {
  ferry: '船票',
  shuttle: '接驳',
  both: '船票+接驳'
};

const FerryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ferry');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFerryId, setSelectedFerryId] = useState<string | null>(null);
  const [selectedShuttleId, setSelectedShuttleId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    guestName: '',
    guestPhone: '',
    passengers: 1,
    type: 'ferry'
  });
  const [bookingList, setBookingList] = useState<ShuttleBookingType[]>([]);

  const ferries = useAppStore(state => state.ferries);
  const shuttles = useAppStore(state => state.shuttles);
  const bookFerryAndShuttle = useAppStore(state => state.bookFerryAndShuttle);
  const getShuttleBookings = useAppStore(state => state.getShuttleBookings);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
    setBookingList(getShuttleBookings());
  });

  const filteredFerries = useMemo(() => {
    return ferries.filter(f => f.date === selectedDate);
  }, [selectedDate, ferries]);

  const filteredShuttles = useMemo(() => {
    const ferryIdsOnDate = new Set(
      ferries.filter(f => f.date === selectedDate).map(f => f.id)
    );
    return shuttles.filter(s => ferryIdsOnDate.has(s.ferryId));
  }, [selectedDate, ferries, shuttles]);

  const selectedFerry = useMemo(() => {
    return ferries.find(f => f.id === selectedFerryId) || null;
  }, [ferries, selectedFerryId]);

  const selectedShuttle = useMemo(() => {
    return shuttles.find(s => s.id === selectedShuttleId) || null;
  }, [shuttles, selectedShuttleId]);

  const remainingFerrySeats = useMemo(() => {
    if (!selectedFerry) return 0;
    return Math.max(0, selectedFerry.availableSeats - bookingForm.passengers);
  }, [selectedFerry, bookingForm.passengers]);

  const remainingShuttleSlots = useMemo(() => {
    if (!selectedShuttle) return 0;
    return Math.max(0, selectedShuttle.capacity - selectedShuttle.bookedCount - bookingForm.passengers);
  }, [selectedShuttle, bookingForm.passengers]);

  const getFerryName = useCallback((ferry: Ferry) => {
    return `${ferry.departureTime} ${ferry.route}`;
  }, []);

  const openFerryBooking = useCallback((ferry: Ferry) => {
    if (ferry.status === 'cancelled') {
      Taro.showToast({ title: '该船班已取消', icon: 'none' });
      return;
    }
    if (ferry.availableSeats <= 0) {
      Taro.showToast({ title: '该船班已售罄', icon: 'none' });
      return;
    }
    setSelectedFerryId(ferry.id);
    setSelectedShuttleId(null);
    setBookingForm({
      guestName: '',
      guestPhone: '',
      passengers: 1,
      type: 'ferry'
    });
    setShowBookingModal(true);
  }, []);

  const openShuttleBooking = useCallback((shuttle: Shuttle) => {
    if (shuttle.bookedCount >= shuttle.capacity) {
      Taro.showToast({ title: '该接驳已满员', icon: 'none' });
      return;
    }
    setSelectedFerryId(shuttle.ferryId);
    setSelectedShuttleId(shuttle.id);
    setBookingForm({
      guestName: '',
      guestPhone: '',
      passengers: 1,
      type: 'shuttle'
    });
    setShowBookingModal(true);
  }, []);

  const getAvailableBookingTypes = useCallback((): BookingType[] => {
    const types: BookingType[] = [];
    if (selectedFerry && selectedFerry.status !== 'cancelled' && selectedFerry.availableSeats > 0) {
      types.push('ferry');
    }
    if (selectedShuttle && selectedShuttle.bookedCount < selectedShuttle.capacity) {
      types.push('shuttle');
    }
    if (
      selectedFerry && selectedFerry.status !== 'cancelled' && selectedFerry.availableSeats > 0 &&
      selectedShuttle && selectedShuttle.bookedCount < selectedShuttle.capacity
    ) {
      types.push('both');
    }
    return types;
  }, [selectedFerry, selectedShuttle]);

  const handleBookingTypeChange = useCallback((type: BookingType) => {
    setBookingForm(prev => ({ ...prev, type }));
  }, []);

  const handlePassengersChange = useCallback((delta: number) => {
    setBookingForm(prev => {
      const newCount = Math.max(1, Math.min(10, prev.passengers + delta));
      return { ...prev, passengers: newCount };
    });
  }, []);

  const handleBookingSubmit = useCallback(() => {
    const { guestName, guestPhone, passengers, type } = bookingForm;

    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(guestPhone.trim())) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (type === 'ferry' || type === 'both') {
      if (!selectedFerry) {
        Taro.showToast({ title: '请选择船班', icon: 'none' });
        return;
      }
      if (selectedFerry.status === 'cancelled') {
        Taro.showToast({ title: '该船班已取消', icon: 'none' });
        return;
      }
      if (selectedFerry.availableSeats < passengers) {
        Taro.showToast({ title: `船票仅剩${selectedFerry.availableSeats}张`, icon: 'none' });
        return;
      }
    }

    if (type === 'shuttle' || type === 'both') {
      if (!selectedShuttle) {
        Taro.showToast({ title: '请选择接驳', icon: 'none' });
        return;
      }
      const remaining = selectedShuttle.capacity - selectedShuttle.bookedCount;
      if (remaining < passengers) {
        Taro.showToast({ title: `接驳仅剩${remaining}个名额`, icon: 'none' });
        return;
      }
    }

    const ferryNameToUse = selectedFerry
      ? getFerryName(selectedFerry)
      : selectedShuttle?.ferryName || '';

    const success = bookFerryAndShuttle({
      ferryId: (type === 'ferry' || type === 'both') ? selectedFerryId || undefined : undefined,
      shuttleId: (type === 'shuttle' || type === 'both') ? selectedShuttleId || undefined : undefined,
      ferryName: ferryNameToUse,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      passengers,
      type,
      date: selectedDate
    });

    if (success) {
      Taro.showToast({ title: '预约成功', icon: 'success' });
      setShowBookingModal(false);
      setSelectedFerryId(null);
      setSelectedShuttleId(null);
      setBookingList(getShuttleBookings());
    } else {
      Taro.showToast({ title: '预约失败', icon: 'none' });
    }
  }, [bookingForm, selectedFerry, selectedShuttle, selectedFerryId, selectedShuttleId, selectedDate, bookFerryAndShuttle, getShuttleBookings, getFerryName]);

  const renderFerryCard = (ferry: Ferry) => {
    const isDisabled = ferry.status === 'cancelled' || ferry.availableSeats <= 0;
    return (
      <View key={ferry.id} className={styles.ferryCard}>
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
            {ferry.status === 'cancelled' ? (
              <Text className={styles.full}>已取消</Text>
            ) : ferry.availableSeats > 0 ? (
              <Text className={styles.available}>剩余 {ferry.availableSeats} 座</Text>
            ) : (
              <Text className={styles.full}>已售罄</Text>
            )}
          </View>
        </View>

        <Button
          className={classnames(styles.bookBtn, isDisabled && styles.disabled)}
          disabled={isDisabled}
          onClick={() => !isDisabled && openFerryBooking(ferry)}
        >
          {ferry.status === 'cancelled' ? '已取消' : ferry.availableSeats <= 0 ? '已售罄' : '预约船票'}
        </Button>
      </View>
    );
  };

  const renderShuttleCard = (shuttle: Shuttle) => {
    const isFull = shuttle.bookedCount >= shuttle.capacity;
    const linkedFerry = ferries.find(f => f.id === shuttle.ferryId);
    return (
      <View key={shuttle.id} className={styles.shuttleCard}>
        <View className={styles.shuttleIcon}>🚐</View>
        <View className={styles.shuttleInfo}>
          <Text className={styles.shuttleTitle}>{shuttle.ferryName}</Text>
          <Text className={styles.shuttleDesc}>
            {shuttle.pickupTime} {shuttle.pickupPoint} → {shuttle.dropoffPoint}
          </Text>
          {shuttle.vehicle && shuttle.driver && (
            <Text className={styles.shuttleDesc}>
              {shuttle.vehicle} · {shuttle.driver}
            </Text>
          )}
          {linkedFerry && (
            <Text className={styles.shuttleDate}>
              对应船班日期: {linkedFerry.date}
            </Text>
          )}
        </View>
        <View className={styles.shuttleRight}>
          <Text className={classnames(styles.shuttleSeats, isFull && styles.full)}>
            {shuttle.bookedCount}/{shuttle.capacity}
          </Text>
          <Text className={styles.shuttleSeatsLabel}>名额</Text>
        </View>
        <Button
          className={classnames(styles.bookBtn, styles.shuttleBookBtn, isFull && styles.disabled)}
          disabled={isFull}
          onClick={() => !isFull && openShuttleBooking(shuttle)}
        >
          {isFull ? '已满员' : '预约接驳'}
        </Button>
      </View>
    );
  };

  const renderBookingRecord = (booking: ShuttleBookingType) => {
    return (
      <View key={booking.id} className={styles.bookingCard}>
        <View className={styles.bookingIcon}>✅</View>
        <View className={styles.bookingInfo}>
          <View className={styles.bookingHeaderRow}>
            <Text className={styles.bookingTitle}>{booking.ferryName}</Text>
            <View className={classnames(styles.bookingTypeTag, styles[`type-${booking.type}`])}>
              {BOOKING_TYPE_LABELS[booking.type]}
            </View>
          </View>
          <Text className={styles.bookingDesc}>
            乘客: {booking.guestName} · {booking.guestPhone}
          </Text>
          <Text className={styles.bookingDesc}>
            人数: {booking.passengers}人
            {booking.date ? ` · 日期: ${booking.date}` : ''}
          </Text>
          <Text className={styles.bookingDesc}>
            预约时间: {booking.bookingTime}
          </Text>
        </View>
      </View>
    );
  };

  const availableBookingTypes = getAvailableBookingTypes();
  const maxPassengers = useMemo(() => {
    let max = 10;
    if (bookingForm.type === 'ferry' || bookingForm.type === 'both') {
      if (selectedFerry) max = Math.min(max, selectedFerry.availableSeats);
    }
    if (bookingForm.type === 'shuttle' || bookingForm.type === 'both') {
      if (selectedShuttle) {
        const shuttleRemaining = selectedShuttle.capacity - selectedShuttle.bookedCount;
        max = Math.min(max, shuttleRemaining);
      }
    }
    return Math.max(1, max);
  }, [bookingForm.type, selectedFerry, selectedShuttle]);

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
          className={classnames(styles.tabItem, activeTab === 'ferry' && styles.active)}
          onClick={() => setActiveTab('ferry')}
        >
          <Text className={styles.tabIcon}>⛴️</Text>
          <Text>船班列表</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'shuttle' && styles.active)}
          onClick={() => setActiveTab('shuttle')}
        >
          <Text className={styles.tabIcon}>🚐</Text>
          <Text>接驳安排</Text>
        </View>
      </View>

      <View className={styles.contentContainer}>
        {activeTab === 'ferry' && (
          <View className={styles.listSection}>
            {filteredFerries.length > 0 ? (
              filteredFerries.map(ferry => renderFerryCard(ferry))
            ) : (
              <View className={styles.emptyState}>
                <View className={styles.emptyIcon}>⛴️</View>
                <Text className={styles.emptyText}>当日暂无船班</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'shuttle' && (
          <View className={styles.listSection}>
            {filteredShuttles.length > 0 ? (
              filteredShuttles.map(shuttle => renderShuttleCard(shuttle))
            ) : (
              <View className={styles.emptyState}>
                <View className={styles.emptyIcon}>🚐</View>
                <Text className={styles.emptyText}>当日暂无接驳安排</Text>
              </View>
            )}
          </View>
        )}

        <View className={styles.myBookingsSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>
            <Text>我的接驳安排</Text>
            {bookingList.length > 0 && (
              <Text className={styles.sectionCount}>共 {bookingList.length} 条</Text>
            )}
          </View>

          {bookingList.length > 0 ? (
            bookingList.map(booking => renderBookingRecord(booking))
          ) : (
            <View className={styles.emptyState}>
              <View className={styles.emptyIcon}>📝</View>
              <Text className={styles.emptyText}>暂无预约记录</Text>
            </View>
          )}
        </View>
      </View>

      {showBookingModal && (
        <View className={styles.modalMask} onClick={() => setShowBookingModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>预约登记</Text>
              <Text className={styles.modalClose} onClick={() => setShowBookingModal(false)}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              {(selectedFerry || selectedShuttle) && (
                <View className={styles.selectedInfoCard}>
                  {selectedFerry && (
                    <View className={styles.selectedInfoRow}>
                      <Text className={styles.selectedInfoLabel}>⛴️ 船班</Text>
                      <Text className={styles.selectedInfoValue}>
                        {selectedFerry.departureTime} {selectedFerry.route}
                        {selectedFerry.availableSeats > 0 ? (
                          <Text className={styles.selectedInfoHint}> (剩{selectedFerry.availableSeats}座)</Text>
                        ) : null}
                      </Text>
                    </View>
                  )}
                  {selectedShuttle && (
                    <View className={styles.selectedInfoRow}>
                      <Text className={styles.selectedInfoLabel}>🚐 接驳</Text>
                      <Text className={styles.selectedInfoValue}>
                        {selectedShuttle.pickupTime} {selectedShuttle.pickupPoint}
                        <Text className={styles.selectedInfoHint}>
                          {' '}(剩{selectedShuttle.capacity - selectedShuttle.bookedCount}名额)
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>预约类型</Text>
                <View className={styles.typeSelector}>
                  {(['ferry', 'shuttle', 'both'] as BookingType[]).map(type => {
                    const isAvailable = availableBookingTypes.includes(type);
                    const isSelected = bookingForm.type === type;
                    return (
                      <View
                        key={type}
                        className={classnames(
                          styles.typeOption,
                          isSelected && styles.typeOptionSelected,
                          !isAvailable && styles.typeOptionDisabled
                        )}
                        onClick={() => isAvailable && handleBookingTypeChange(type)}
                      >
                        <Text className={styles.typeOptionText}>{TYPE_LABELS[type]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  乘客人数
                  <Text className={styles.formHint}> (1-10人)</Text>
                </Text>
                <View className={styles.seatsSelector}>
                  <Button
                    className={styles.seatsBtn}
                    disabled={bookingForm.passengers <= 1}
                    onClick={() => handlePassengersChange(-1)}
                  >-</Button>
                  <Text className={styles.seatsCount}>{bookingForm.passengers}</Text>
                  <Button
                    className={styles.seatsBtn}
                    disabled={bookingForm.passengers >= maxPassengers}
                    onClick={() => handlePassengersChange(1)}
                  >+</Button>
                </View>
                <View className={styles.remainingInfo}>
                  {(bookingForm.type === 'ferry' || bookingForm.type === 'both') && selectedFerry && (
                    <View className={styles.remainingItem}>
                      <Text className={styles.remainingLabel}>船票剩余:</Text>
                      <Text className={classnames(
                        styles.remainingValue,
                        remainingFerrySeats <= 0 && styles.danger
                      )}>
                        {remainingFerrySeats}座
                      </Text>
                    </View>
                  )}
                  {(bookingForm.type === 'shuttle' || bookingForm.type === 'both') && selectedShuttle && (
                    <View className={styles.remainingItem}>
                      <Text className={styles.remainingLabel}>接驳剩余:</Text>
                      <Text className={classnames(
                        styles.remainingValue,
                        remainingShuttleSlots <= 0 && styles.danger
                      )}>
                        {remainingShuttleSlots}名额
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>乘客姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入姓名'
                  value={bookingForm.guestName}
                  onInput={e => setBookingForm(prev => ({ ...prev, guestName: e.detail.value }))}
                  maxlength={20}
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.formLabel}>联系电话</Text>
                <Input
                  className={styles.formInput}
                  type='number'
                  placeholder='请输入手机号码'
                  value={bookingForm.guestPhone}
                  onInput={e => setBookingForm(prev => ({ ...prev, guestPhone: e.detail.value }))}
                  maxlength={11}
                />
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button
                className={styles.modalBtnCancel}
                onClick={() => setShowBookingModal(false)}
              >
                取消
              </Button>
              <Button
                className={styles.modalBtnConfirm}
                onClick={handleBookingSubmit}
              >
                确认预约
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FerryPage;
