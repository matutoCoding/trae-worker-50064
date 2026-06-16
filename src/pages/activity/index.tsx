import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatPrice } from '@/utils';
import classnames from 'classnames';

type FilterType = 'all' | 'diving' | 'snorkeling' | 'fishing' | 'kayaking';

interface MyBooking {
  id: string;
  activityId: string;
  activityName: string;
  participants: number;
  guestName: string;
  guestPhone: string;
  bookingTime: string;
}

const ActivityPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    participants: 1,
    guestName: '',
    guestPhone: ''
  });
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);

  const activities = useAppStore(state => state.activities);
  const bookActivity = useAppStore(state => state.bookActivity);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
    const stored = Taro.getStorageSync('activity_bookings');
    if (stored) {
      setMyBookings(JSON.parse(stored));
    }
  });

  const filters: { id: FilterType; name: string; icon: string }[] = [
    { id: 'all', name: '全部', icon: '🎯' },
    { id: 'diving', name: '潜水', icon: '🤿' },
    { id: 'snorkeling', name: '浮潜', icon: '🏊' },
    { id: 'fishing', name: '海钓', icon: '🎣' },
    { id: 'kayaking', name: '皮划艇', icon: '🚣' }
  ];

  const typeNames: Record<string, string> = {
    diving: '深潜',
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

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter(a => a.type === filter);
  }, [filter, activities]);

  const handleBook = useCallback((activityId: string, activityName: string) => {
    console.log('[Activity] 预约活动:', activityId, activityName);
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const remaining = activity.maxParticipants - activity.currentParticipants;
    if (remaining <= 0) {
      Taro.showToast({ title: '该活动已满员', icon: 'none' });
      return;
    }

    setSelectedActivityId(activityId);
    setBookingForm({ participants: 1, guestName: '', guestPhone: '' });
    setShowBookingModal(true);
  }, [activities]);

  const handleBookingSubmit = useCallback(() => {
    if (!bookingForm.guestName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!bookingForm.guestPhone.trim()) {
      Taro.showToast({ title: '请输入电话', icon: 'none' });
      return;
    }
    if (!selectedActivityId) return;

    const activity = activities.find(a => a.id === selectedActivityId);
    if (!activity) return;

    const remaining = activity.maxParticipants - activity.currentParticipants;
    if (remaining < bookingForm.participants) {
      Taro.showToast({ title: `仅剩${remaining}个名额`, icon: 'none' });
      return;
    }

    const success = bookActivity({
      activityId: selectedActivityId,
      activityName: activity.name,
      participants: bookingForm.participants,
      guestName: bookingForm.guestName,
      guestPhone: bookingForm.guestPhone
    });

    if (success) {
      const newBooking: MyBooking = {
        id: Math.random().toString(36).substring(2, 10),
        activityId: selectedActivityId,
        activityName: activity.name,
        participants: bookingForm.participants,
        guestName: bookingForm.guestName,
        guestPhone: bookingForm.guestPhone,
        bookingTime: new Date().toLocaleString('zh-CN')
      };
      const updatedBookings = [...myBookings, newBooking];
      setMyBookings(updatedBookings);
      Taro.setStorageSync('activity_bookings', JSON.stringify(updatedBookings));

      setShowBookingModal(false);
      setSelectedActivityId(null);
      Taro.showToast({ title: '预约成功', icon: 'success' });
    } else {
      Taro.showToast({ title: '预约失败', icon: 'none' });
    }
  }, [selectedActivityId, bookingForm, activities, bookActivity, myBookings]);

  const handleActivityClick = useCallback((activityId: string) => {
    console.log('[Activity] 查看详情:', activityId);
  }, []);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>海岛活动</Text>
        <Text className={styles.headerSubtitle}>潜水浮潜 · 海钓探险 · 尽享海岛乐趣</Text>
      </View>

      <ScrollView className={styles.filterTabs} scrollX>
        {filters.map(f => (
          <View
            key={f.id}
            className={classnames(styles.tabItem, filter === f.id && styles.active)}
            onClick={() => setFilter(f.id)}
          >
            {f.icon} {f.name}
          </View>
        ))}
      </ScrollView>

      <View className={styles.activityList}>
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => {
            const isFull = activity.currentParticipants >= activity.maxParticipants;
            return (
              <View
                key={activity.id}
                className={styles.activityCard}
                onClick={() => handleActivityClick(activity.id)}
              >
                <View className={styles.activityImage}>
                  <Image src={activity.image} mode='aspectFill' />
                  <View className={styles.typeTag}>{typeNames[activity.type]}</View>
                  <View className={styles.difficultyTag}>
                    难度：{difficultyNames[activity.difficulty]}
                  </View>
                </View>

                <View className={styles.activityContent}>
                  <Text className={styles.activityTitle}>{activity.name}</Text>
                  <Text className={styles.activityDesc}>{activity.description}</Text>

                  <View className={styles.activityMeta}>
                    <View className={styles.metaItem}>
                      <Text className={styles.icon}>⏰</Text>
                      <Text>{activity.duration}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text className={styles.icon}>📍</Text>
                      <Text>{activity.location}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text className={styles.icon}>📅</Text>
                      <Text>{activity.date} {activity.startTime}</Text>
                    </View>
                  </View>

                  <View className={styles.includes}>
                    {activity.includes.map((item, idx) => (
                      <Text key={idx} className={styles.includeTag}>
                        ✓ {item}
                      </Text>
                    ))}
                  </View>

                  <View className={styles.activityFooter}>
                    <View>
                      <View className={styles.priceWrap}>
                        <Text className={styles.price}>{formatPrice(activity.price)}</Text>
                        <Text className={styles.unit}>/人</Text>
                      </View>
                      <View className={styles.slotsInfo}>
                        名额：
                        {isFull ? (
                          <Text className={styles.full}>已满</Text>
                        ) : (
                          <Text className={styles.slots}>
                            {activity.maxParticipants - activity.currentParticipants}位可约
                          </Text>
                        )}
                      </View>
                    </View>
                    <Button
                      className={classnames(styles.bookBtn, isFull && styles.disabled)}
                      disabled={isFull}
                      onClick={(e) => {
                        e.stopPropagation?.();
                        if (!isFull) {
                          handleBook(activity.id, activity.name);
                        }
                      }}
                    >
                      {isFull ? '已满员' : '立即预约'}
                    </Button>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.icon}>🏝️</View>
            <Text className={styles.text}>暂无相关活动</Text>
          </View>
        )}

        {myBookings.length > 0 && (
          <View className={styles.myBookingsSection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.icon}>📋</Text>
              <Text>我的预约</Text>
            </View>

            {myBookings.map(booking => (
              <View key={booking.id} className={styles.bookingCard}>
                <View className={styles.bookingIcon}>✅</View>
                <View className={styles.bookingInfo}>
                  <Text className={styles.bookingTitle}>{booking.activityName}</Text>
                  <Text className={styles.bookingDesc}>
                    人数: {booking.participants}人 · {booking.guestName}
                  </Text>
                  <Text className={styles.bookingDesc}>
                    预约时间: {booking.bookingTime}
                  </Text>
                </View>
                <Text className={styles.bookingStatus}>已确认</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {showBookingModal && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>活动预约</Text>
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
                <Text className={styles.formLabel}>参与人数</Text>
                <View className={styles.seatsSelector}>
                  <Button
                    className={styles.seatsBtn}
                    onClick={() => setBookingForm({ ...bookingForm, participants: Math.max(1, bookingForm.participants - 1) })}
                  >-</Button>
                  <Text className={styles.seatsCount}>{bookingForm.participants}</Text>
                  <Button
                    className={styles.seatsBtn}
                    onClick={() => setBookingForm({ ...bookingForm, participants: Math.min(10, bookingForm.participants + 1) })}
                  >+</Button>
                </View>
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnCancel} onClick={() => setShowBookingModal(false)}>取消</Button>
              <Button className={styles.modalBtnConfirm} onClick={handleBookingSubmit}>确认预约</Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ActivityPage;
