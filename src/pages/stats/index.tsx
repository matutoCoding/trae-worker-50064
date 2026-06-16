import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store';
import { statsData, dailyRevenues as staticDailyRevenues, reviews } from '@/data/stats';
import { renderStars, formatPrice, formatDate } from '@/utils';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  useDidShow(() => {
    useAppStore.getState().hydrate();
  });

  const orders = useAppStore(state => state.orders);
  const diningBookings = useAppStore(state => state.diningBookings);
  const activityBookings = useAppStore(state => state.activityBookings);
  const rooms = useAppStore(state => state.rooms);

  const today = formatDate(new Date());

  const computedStats = useMemo(() => {
    // 客房收入：所有非取消/非退款的 confirmed/checkedIn/checkedOut 订单
    const validRoomOrders = orders.filter(o =>
      ['confirmed', 'checkedIn', 'checkedOut'].includes(o.status)
    );
    const roomRevenue = validRoomOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 餐饮收入：confirmed / completed 状态
    const validDining = diningBookings.filter(d =>
      ['confirmed', 'completed'].includes(d.status)
    );
    const diningRevenue = validDining.reduce((sum, d) => sum + d.totalAmount, 0);

    // 活动收入：confirmed 状态
    const validActivities = activityBookings.filter(a =>
      a.status === 'confirmed' || a.status === 'completed'
    );
    const activityRevenue = validActivities.reduce((sum, a) => sum + a.totalPrice, 0);

    const todayRevenue = roomRevenue + diningRevenue + activityRevenue;

    // 入住相关
    const todayCheckIns = orders.filter(o => o.checkInDate === today && ['confirmed', 'checkedIn'].includes(o.status)).length;
    const todayCheckOuts = orders.filter(o => o.checkOutDate === today && ['checkedIn', 'checkedOut'].includes(o.status)).length;

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;

    return {
      todayRevenue,
      roomRevenue,
      diningRevenue,
      activityRevenue,
      todayCheckIns,
      todayCheckOuts,
      occupancyRate,
      totalRooms,
      occupiedRooms,
      monthOrders: validRoomOrders.length + validDining.length + validActivities.length
    };
  }, [orders, diningBookings, activityBookings, rooms, today]);

  // 合并餐饮收入到近7天的静态收益（展示用）
  const dailyRevenues = useMemo(() => {
    const recent = [...staticDailyRevenues];
    if (recent.length > 0) {
      const last = recent[recent.length - 1];
      const addOn = Math.round(computedStats.diningRevenue / 7);
      recent[recent.length - 1] = {
        ...last,
        revenue: last.revenue + addOn + Math.round(computedStats.activityRevenue / 7),
        orders: last.orders + Math.round(computedStats.monthOrders / 15)
      };
    }
    return recent;
  }, [computedStats.diningRevenue, computedStats.activityRevenue, computedStats.monthOrders]);

  const maxRevenue = useMemo(() => {
    return Math.max(...dailyRevenues.map(d => d.revenue), 1);
  }, [dailyRevenues]);

  const ratingBreakdown = [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 15 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 }
  ];

  const monthRevenue = statsData.monthRevenue + Math.round(computedStats.diningRevenue * 0.6) + computedStats.activityRevenue;

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>收益统计</Text>
        <Text className={styles.headerDate}>2026年6月</Text>
        <View className={styles.totalRevenue}>
          <Text className={styles.label}>本月总收入</Text>
          <View className={styles.amount}>
            <Text className={styles.symbol}>¥</Text>
            <Text>{monthRevenue.toLocaleString()}</Text>
          </View>
          <View className={styles.trend}>
            <Text className={styles.up}>↑ 12.5% 较上月</Text>
          </View>
        </View>
      </View>

      {/* 收入构成 */}
      <View className={styles.breakdownSection}>
        <Text className={styles.breakdownTitle}>今日收入构成</Text>
        <View className={styles.breakdownGrid}>
          <View className={styles.breakdownCard} style={{ background: 'linear-gradient(135deg,#0088cc,#00bfff)' }}>
            <Text className={styles.breakdownIcon}>🛏️</Text>
            <Text className={styles.breakdownLabel}>客房收入</Text>
            <Text className={styles.breakdownValue}>{formatPrice(computedStats.roomRevenue)}</Text>
          </View>
          <View className={styles.breakdownCard} style={{ background: 'linear-gradient(135deg,#ff8c42,#ffb86c)' }}>
            <Text className={styles.breakdownIcon}>🍽️</Text>
            <Text className={styles.breakdownLabel}>餐饮收入</Text>
            <Text className={styles.breakdownValue}>{formatPrice(computedStats.diningRevenue)}</Text>
          </View>
          <View className={styles.breakdownCard} style={{ background: 'linear-gradient(135deg,#2ecc71,#5cd898)' }}>
            <Text className={styles.breakdownIcon}>🎯</Text>
            <Text className={styles.breakdownLabel}>活动收入</Text>
            <Text className={styles.breakdownValue}>{formatPrice(computedStats.activityRevenue)}</Text>
          </View>
          <View className={styles.breakdownCard} style={{ background: 'linear-gradient(135deg,#9b59b6,#b370cc)' }}>
            <Text className={styles.breakdownIcon}>💰</Text>
            <Text className={styles.breakdownLabel}>今日合计</Text>
            <Text className={styles.breakdownValue}>{formatPrice(computedStats.todayRevenue)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>📊</Text>
            入住率
          </Text>
          <View>
            <Text className={styles.value}>{(computedStats.occupancyRate * 100).toFixed(0)}%</Text>
            <Text className={styles.unit}></Text>
          </View>
          <Text className={styles.subText}>{computedStats.occupiedRooms}/{computedStats.totalRooms} 间在住</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>📝</Text>
            今日入住
          </Text>
          <View>
            <Text className={styles.value}>{computedStats.todayCheckIns}</Text>
            <Text className={styles.unit}>间</Text>
          </View>
          <Text className={styles.subText}>退房 {computedStats.todayCheckOuts} 间</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>🧾</Text>
            本月订单
          </Text>
          <View>
            <Text className={styles.value}>{computedStats.monthOrders}</Text>
            <Text className={styles.unit}>单</Text>
          </View>
          <Text className={styles.subText}>上月 {statsData.monthOrders} 单</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>⭐</Text>
            平均评分
          </Text>
          <View>
            <Text className={styles.value}>{statsData.avgRating}</Text>
            <Text className={styles.unit}>分</Text>
          </View>
          <Text className={styles.subText}>共 {statsData.totalReviews} 条评价</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>近7天收益</Text>
          <Text className={styles.more}>查看详情 ›</Text>
        </View>
        <View className={styles.chartCard}>
          <Text className={styles.chartTitle}>每日收益趋势</Text>
          <View className={styles.chartBars}>
            {dailyRevenues.map(day => {
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <View key={day.date} className={styles.chartBar}>
                  <View className={styles.bar} style={{ height: `${Math.max(heightPercent, 4)}%` }}>
                    <Text className={styles.barValue}>¥{(day.revenue / 1000).toFixed(1)}k</Text>
                  </View>
                  <Text className={styles.label}>{day.date}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.reviewSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>客人评价</Text>
          <Text className={styles.more}>全部 {statsData.totalReviews} 条 ›</Text>
        </View>

        <View className={styles.reviewSummary}>
          <View className={styles.ratingBig}>
            <Text className={styles.score}>{statsData.avgRating}</Text>
            <Text className={styles.stars}>{renderStars(statsData.avgRating)}</Text>
            <Text className={styles.count}>{statsData.totalReviews} 条评价</Text>
          </View>
          <View className={styles.ratingBars}>
            {ratingBreakdown.map(item => (
              <View key={item.stars} className={styles.ratingBarItem}>
                <Text className={styles.stars}>{renderStars(item.stars)}</Text>
                <View className={styles.bar}>
                  <View className={styles.fill} style={{ width: `${item.pct}%` }} />
                </View>
                <Text className={styles.pct}>{item.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.reviewList}>
          {reviews.slice(0, 3).map(review => (
            <View key={review.id} className={styles.reviewCard}>
              <View className={styles.reviewHeader}>
                <View className={styles.reviewAvatar}>
                  <Image src={review.avatar} mode='aspectFill' />
                </View>
                <View className={styles.reviewInfo}>
                  <Text className={styles.reviewName}>{review.guestName}</Text>
                  <View className={styles.reviewMeta}>
                    <Text className={styles.reviewStars}>{renderStars(review.rating)}</Text>
                    <Text>{review.roomTypeName}</Text>
                    <Text>·</Text>
                    <Text>{review.createTime}</Text>
                  </View>
                </View>
              </View>
              <Text className={styles.reviewContent}>{review.content}</Text>
              {review.reply && (
                <View className={styles.reviewReply}>
                  <Text className={styles.replyLabel}>商家回复</Text>
                  <Text>{review.reply}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default StatsPage;
