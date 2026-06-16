import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, Button, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatPrice, getStatusText, getStatusColor } from '@/utils';
import classnames from 'classnames';
import type { Activity, ActivityBooking } from '@/types';

type RefundReasonType = 'typhoon' | 'personal' | 'other';

const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'my'>('list');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ActivityBooking | null>(null);
  const [bookingForm, setBookingForm] = useState({
    participants: 1,
    guestName: '',
    guestPhone: ''
  });
  const [refundForm, setRefundForm] = useState({
    reasonType: 'personal' as RefundReasonType,
    reason: '',
    remark: ''
  });

  const activities = useAppStore(state => state.activities);
  const activityBookings = useAppStore(state => state.activityBookings);
  const bookActivity = useAppStore(state => state.bookActivity);
  const addRefundRequest = useAppStore(state => state.addRefundRequest);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
  });

  const typeNames: Record<string, string> = {
    diving: '潜水',
    snorkeling: '浮潜',
    fishing: '海钓',
    kayaking: '皮划艇',
    other: '其他'
  };

  const difficultyNames: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };

  const refundReasonTypeOptions: { id: RefundReasonType; name: string }[] = [
    { id: 'typhoon', name: '台风停航' },
    { id: 'personal', name: '个人原因' },
    { id: 'other', name: '其他原因' }
  ];

  const isActivityExpired = useCallback((activity: Activity): boolean => {
    const now = new Date();
    const activityDateTime = new Date(`${activity.date}T${activity.endTime}:00`);
    return now > activityDateTime;
  }, []);

  const canBook = useCallback((activity: Activity): boolean => {
    if (activity.currentParticipants >= activity.maxParticipants) return false;
    if (isActivityExpired(activity)) return false;
    return true;
  }, [isActivityExpired]);

  const getButtonText = useCallback((activity: Activity): string => {
    if (activity.currentParticipants >= activity.maxParticipants) return '已满员';
    if (isActivityExpired(activity)) return '已过期';
    return '立即预约';
  }, [isActivityExpired]);

  const sortedBookings = useMemo(() => {
    return [...activityBookings].sort((a, b) => {
      return new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime();
    });
  }, [activityBookings]);

  const openBookingModal = useCallback((activity: Activity) => {
    if (!canBook(activity)) {
      if (activity.currentParticipants >= activity.maxParticipants) {
        Taro.showToast({ title: '该活动已满员', icon: 'none' });
      } else if (isActivityExpired(activity)) {
        Taro.showToast({ title: '该活动已过期', icon: 'none' });
      }
      return;
    }
    setSelectedActivity(activity);
    setBookingForm({ participants: 1, guestName: '', guestPhone: '' });
    setShowBookingModal(true);
  }, [canBook, isActivityExpired]);

  const closeBookingModal = useCallback(() => {
    setShowBookingModal(false);
    setSelectedActivity(null);
  }, []);

  const remainingSlots = useMemo(() => {
    if (!selectedActivity) return 0;
    return selectedActivity.maxParticipants - selectedActivity.currentParticipants;
  }, [selectedActivity]);

  const totalPrice = useMemo(() => {
    if (!selectedActivity) return 0;
    return selectedActivity.price * bookingForm.participants;
  }, [selectedActivity, bookingForm.participants]);

  const handleParticipantsChange = useCallback((delta: number) => {
    setBookingForm(prev => {
      const newVal = prev.participants + delta;
      const clamped = Math.max(1, Math.min(10, newVal));
      if (clamped > remainingSlots && remainingSlots > 0) {
        return { ...prev, participants: remainingSlots };
      }
      return { ...prev, participants: clamped };
    });
  }, [remainingSlots]);

  const handleBookingSubmit = useCallback(() => {
    if (!selectedActivity) return;

    if (!bookingForm.guestName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!bookingForm.guestPhone.trim()) {
      Taro.showToast({ title: '请输入电话', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(bookingForm.guestPhone.trim())) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (bookingForm.participants > remainingSlots) {
      Taro.showToast({ title: `仅剩${remainingSlots}位可约`, icon: 'none' });
      return;
    }

    const success = bookActivity({
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      guestName: bookingForm.guestName.trim(),
      guestPhone: bookingForm.guestPhone.trim(),
      participants: bookingForm.participants,
      totalPrice
    });

    if (success) {
      Taro.showToast({ title: '预约成功', icon: 'success' });
      closeBookingModal();
    } else {
      Taro.showToast({ title: '预约失败，请重试', icon: 'none' });
    }
  }, [selectedActivity, bookingForm, remainingSlots, totalPrice, bookActivity, closeBookingModal]);

  const openRefundModal = useCallback((booking: ActivityBooking) => {
    setSelectedBooking(booking);
    setRefundForm({ reasonType: 'personal', reason: '', remark: '' });
    setShowRefundModal(true);
  }, []);

  const closeRefundModal = useCallback(() => {
    setShowRefundModal(false);
    setSelectedBooking(null);
  }, []);

  const handleRefundSubmit = useCallback(() => {
    if (!selectedBooking) return;

    if (!refundForm.reason.trim()) {
      Taro.showToast({ title: '请输入退订原因', icon: 'none' });
      return;
    }

    addRefundRequest({
      orderType: 'activity',
      orderId: selectedBooking.id,
      orderNo: selectedBooking.id,
      guestName: selectedBooking.guestName,
      reason: refundForm.reason.trim(),
      reasonType: refundForm.reasonType,
      refundAmount: selectedBooking.totalPrice,
      totalAmount: selectedBooking.totalPrice
    });

    Taro.showToast({ title: '退订申请已提交', icon: 'success' });
    closeRefundModal();
  }, [selectedBooking, refundForm, addRefundRequest, closeRefundModal]);

  const renderProgressBar = (current: number, max: number) => {
    const percent = Math.min(100, Math.round((current / max) * 100));
    const isFull = current >= max;
    return (
      <View className={styles.progressWrap}>
        <View className={styles.progressBar}>
          <View
            className={classnames(styles.progressFill, isFull && styles.full)}
            style={{ width: `${percent}%` }}
          />
        </View>
        <View className={styles.progressText}>
          <Text className={styles.progressCurrent}>{current}位已约</Text>
          <Text className={styles.progressMax}>/ 共{max}位</Text>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>海岛活动</Text>
        <Text className={styles.headerSubtitle}>潜水浮潜 · 海钓探险 · 尽享海岛乐趣</Text>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'list' && styles.active)}
          onClick={() => setActiveTab('list')}
        >
          <Text>🎯 活动列表</Text>
          <View className={styles.tabBadge}>{activities.length}</View>
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'my' && styles.active)}
          onClick={() => setActiveTab('my')}
        >
          <Text>📋 我的预约</Text>
          <View className={styles.tabBadge}>{sortedBookings.length}</View>
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        {activeTab === 'list' && (
          <View className={styles.activityList}>
            {activities.length > 0 ? (
              activities.map(activity => {
                const remaining = activity.maxParticipants - activity.currentParticipants;
                const bookable = canBook(activity);
                const expired = isActivityExpired(activity);
                return (
                  <View key={activity.id} className={styles.activityCard}>
                    <View className={styles.activityImageWrap}>
                      <Image
                        className={styles.activityImage}
                        src={activity.image}
                        mode='aspectFill'
                      />
                      <View className={styles.typeTag}>{typeNames[activity.type]}</View>
                      <View
                        className={classnames(
                          styles.difficultyTag,
                          styles[`difficulty-${activity.difficulty}`]
                        )}
                      >
                        难度：{difficultyNames[activity.difficulty]}
                      </View>
                      {expired && (
                        <View className={styles.expiredMask}>
                          <Text className={styles.expiredText}>已过期</Text>
                        </View>
                      )}
                    </View>

                    <View className={styles.activityBody}>
                      <View className={styles.activityHead}>
                        <Text className={styles.activityName}>{activity.name}</Text>
                        <View className={styles.durationTag}>
                          <Text className={styles.durationIcon}>⏱</Text>
                          <Text>{activity.duration}</Text>
                        </View>
                      </View>

                      <View className={styles.activityInfo}>
                        <View className={styles.infoRow}>
                          <Text className={styles.infoIcon}>📅</Text>
                          <Text className={styles.infoText}>
                            {activity.date} {activity.startTime} - {activity.endTime}
                          </Text>
                        </View>
                        <View className={styles.infoRow}>
                          <Text className={styles.infoIcon}>📍</Text>
                          <Text className={styles.infoText}>{activity.location}</Text>
                        </View>
                      </View>

                      <View className={styles.slotsSection}>
                        {renderProgressBar(activity.currentParticipants, activity.maxParticipants)}
                        <View className={styles.slotsRemaining}>
                          {remaining > 0 ? (
                            <Text className={styles.remainingText}>
                              剩余 <Text className={styles.remainingNum}>{remaining}</Text> 位
                            </Text>
                          ) : (
                            <Text className={styles.fullText}>名额已满</Text>
                          )}
                        </View>
                      </View>

                      <View className={styles.activityFooter}>
                        <View className={styles.priceSection}>
                          <Text className={styles.priceSymbol}>¥</Text>
                          <Text className={styles.priceValue}>{activity.price}</Text>
                          <Text className={styles.priceUnit}>/人</Text>
                        </View>
                        <Button
                          className={classnames(
                            styles.bookButton,
                            !bookable && styles.disabled
                          )}
                          disabled={!bookable}
                          onClick={() => openBookingModal(activity)}
                        >
                          {getButtonText(activity)}
                        </Button>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🏝️</Text>
                <Text className={styles.emptyText}>暂无活动</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'my' && (
          <View className={styles.bookingList}>
            {sortedBookings.length > 0 ? (
              sortedBookings.map(booking => {
                const activity = activities.find(a => a.id === booking.activityId);
                const statusColor = getStatusColor(booking.status, 'order');
                const canRefund = booking.status === 'confirmed';
                return (
                  <View key={booking.id} className={styles.bookingCard}>
                    <View className={styles.bookingHead}>
                      <Text className={styles.bookingActivityName}>{booking.activityName}</Text>
                      <View
                        className={styles.bookingStatus}
                        style={{ color: statusColor, borderColor: statusColor }}
                      >
                        {getStatusText(booking.status, 'order')}
                      </View>
                    </View>

                    <View className={styles.bookingInfo}>
                      <View className={styles.bookingInfoRow}>
                        <Text className={styles.bookingInfoLabel}>预约时间</Text>
                        <Text className={styles.bookingInfoValue}>{booking.bookingTime}</Text>
                      </View>
                      <View className={styles.bookingInfoRow}>
                        <Text className={styles.bookingInfoLabel}>参与人数</Text>
                        <Text className={styles.bookingInfoValue}>{booking.participants}人</Text>
                      </View>
                      <View className={styles.bookingInfoRow}>
                        <Text className={styles.bookingInfoLabel}>联系人</Text>
                        <Text className={styles.bookingInfoValue}>
                          {booking.guestName} · {booking.guestPhone}
                        </Text>
                      </View>
                      {activity && (
                        <View className={styles.bookingInfoRow}>
                          <Text className={styles.bookingInfoLabel}>活动时间</Text>
                          <Text className={styles.bookingInfoValue}>
                            {activity.date} {activity.startTime}-{activity.endTime}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className={styles.bookingFoot}>
                      <View className={styles.bookingTotal}>
                        <Text className={styles.bookingTotalLabel}>总金额</Text>
                        <View className={styles.bookingTotalPrice}>
                          <Text className={styles.bookingTotalSymbol}>¥</Text>
                          <Text className={styles.bookingTotalValue}>{booking.totalPrice}</Text>
                        </View>
                      </View>
                      {canRefund && (
                        <Button
                          className={styles.refundButton}
                          onClick={() => openRefundModal(booking)}
                        >
                          申请退订
                        </Button>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📋</Text>
                <Text className={styles.emptyText}>暂无预约记录</Text>
                <Text className={styles.emptySubText}>去活动列表看看吧~</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {showBookingModal && selectedActivity && (
        <View className={styles.modalMask} onClick={closeBookingModal}>
          <View className={styles.modal} onClick={e => e.stopPropagation?.()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>活动预约</Text>
              <Text className={styles.modalClose} onClick={closeBookingModal}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.modalActivityInfo}>
                <Image
                  className={styles.modalActivityImage}
                  src={selectedActivity.image}
                  mode='aspectFill'
                />
                <View className={styles.modalActivityDetail}>
                  <Text className={styles.modalActivityName}>{selectedActivity.name}</Text>
                  <View className={styles.modalActivityMeta}>
                    <Text className={styles.modalMetaItem}>📅 {selectedActivity.date}</Text>
                    <Text className={styles.modalMetaItem}>🕐 {selectedActivity.startTime}-{selectedActivity.endTime}</Text>
                  </View>
                  <Text className={styles.modalMetaItem}>📍 {selectedActivity.location}</Text>
                  <View className={styles.modalActivityPrice}>
                    <Text className={styles.modalPriceLabel}>单价</Text>
                    <Text className={styles.modalPriceValue}>{formatPrice(selectedActivity.price)}/人</Text>
                    <Text className={styles.modalSlotsInfo}>
                      剩余 <Text className={styles.modalSlotsNum}>{remainingSlots}</Text> 位可约
                    </Text>
                  </View>
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>参与人数</Text>
                <View className={styles.participantsSelector}>
                  <Button
                    className={classnames(
                      styles.stepperBtn,
                      bookingForm.participants <= 1 && styles.stepperDisabled
                    )}
                    disabled={bookingForm.participants <= 1}
                    onClick={() => handleParticipantsChange(-1)}
                  >-</Button>
                  <View className={styles.participantsCount}>
                    <Text className={styles.participantsNum}>{bookingForm.participants}</Text>
                    <Text className={styles.participantsUnit}>人</Text>
                  </View>
                  <Button
                    className={classnames(
                      styles.stepperBtn,
                      (bookingForm.participants >= 10 || bookingForm.participants >= remainingSlots) && styles.stepperDisabled
                    )}
                    disabled={bookingForm.participants >= 10 || bookingForm.participants >= remainingSlots}
                    onClick={() => handleParticipantsChange(1)}
                  >+</Button>
                </View>
                {remainingSlots < 10 && (
                  <Text className={styles.slotsWarning}>最多可约 {remainingSlots} 位</Text>
                )}
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>参与者信息</Text>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>姓名</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='请输入姓名'
                    placeholderClass={styles.placeholder}
                    value={bookingForm.guestName}
                    onInput={e => setBookingForm({ ...bookingForm, guestName: e.detail.value })}
                    maxlength={20}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>电话</Text>
                  <Input
                    className={styles.formInput}
                    type='number'
                    placeholder='请输入手机号'
                    placeholderClass={styles.placeholder}
                    value={bookingForm.guestPhone}
                    onInput={e => setBookingForm({ ...bookingForm, guestPhone: e.detail.value })}
                    maxlength={11}
                  />
                </View>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <View className={styles.totalSection}>
                <Text className={styles.totalLabel}>总价</Text>
                <View className={styles.totalPrice}>
                  <Text className={styles.totalSymbol}>¥</Text>
                  <Text className={styles.totalValue}>{totalPrice}</Text>
                </View>
                <Text className={styles.totalCalc}>
                  {selectedActivity.price} × {bookingForm.participants}人
                </Text>
              </View>
              <Button className={styles.submitButton} onClick={handleBookingSubmit}>
                确认预约
              </Button>
            </View>
          </View>
        </View>
      )}

      {showRefundModal && selectedBooking && (
        <View className={styles.modalMask} onClick={closeRefundModal}>
          <View className={styles.modal} onClick={e => e.stopPropagation?.()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>申请退订</Text>
              <Text className={styles.modalClose} onClick={closeRefundModal}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.refundOrderInfo}>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>活动名称</Text>
                  <Text className={styles.refundOrderValue}>{selectedBooking.activityName}</Text>
                </View>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>预约时间</Text>
                  <Text className={styles.refundOrderValue}>{selectedBooking.bookingTime}</Text>
                </View>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>参与人数</Text>
                  <Text className={styles.refundOrderValue}>{selectedBooking.participants}人</Text>
                </View>
                <View className={styles.refundOrderRow}>
                  <Text className={styles.refundOrderLabel}>退款金额</Text>
                  <Text className={styles.refundAmount}>
                    <Text className={styles.refundAmountSymbol}>¥</Text>
                    <Text className={styles.refundAmountValue}>{selectedBooking.totalPrice}</Text>
                  </Text>
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>退订原因类型</Text>
                <View className={styles.reasonTypeList}>
                  {refundReasonTypeOptions.map(opt => (
                    <View
                      key={opt.id}
                      className={classnames(
                        styles.reasonTypeItem,
                        refundForm.reasonType === opt.id && styles.reasonTypeActive
                      )}
                      onClick={() => setRefundForm({ ...refundForm, reasonType: opt.id })}
                    >
                      <View
                        className={classnames(
                          styles.radio,
                          refundForm.reasonType === opt.id && styles.radioChecked
                        )}
                      >
                        {refundForm.reasonType === opt.id && <View className={styles.radioInner} />}
                      </View>
                      <Text>{opt.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>退订原因 <Text className={styles.required}>*</Text></Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder='请详细描述退订原因...'
                  placeholderClass={styles.placeholder}
                  value={refundForm.reason}
                  onInput={e => setRefundForm({ ...refundForm, reason: e.detail.value })}
                  maxlength={200}
                />
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formSectionTitle}>备注说明（选填）</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder='其他需要说明的信息...'
                  placeholderClass={styles.placeholder}
                  value={refundForm.remark}
                  onInput={e => setRefundForm({ ...refundForm, remark: e.detail.value })}
                  maxlength={200}
                />
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.cancelButton} onClick={closeRefundModal}>
                取消
              </Button>
              <Button className={styles.refundSubmitButton} onClick={handleRefundSubmit}>
                提交申请
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ActivityPage;
