import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import styles from './index.module.scss';
import { statsData, dailyRevenues, reviews } from '@/data/stats';
import { renderStars, formatPrice } from '@/utils';

const StatsPage: React.FC = () => {
  const maxRevenue = useMemo(() => {
    return Math.max(...dailyRevenues.map(d => d.revenue));
  }, []);

  const ratingBreakdown = [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 15 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 }
  ];

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>收益统计</Text>
        <Text className={styles.headerDate}>2026年6月</Text>
        <View className={styles.totalRevenue}>
          <Text className={styles.label}>本月总收入</Text>
          <View className={styles.amount}>
            <Text className={styles.symbol}>¥</Text>
            <Text>{statsData.monthRevenue.toLocaleString()}</Text>
          </View>
          <View className={styles.trend}>
            <Text className={styles.up}>↑ 12.5% 较上月</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>💰</Text>
            今日收入
          </Text>
          <View>
            <Text className={styles.value}>{formatPrice(statsData.todayRevenue)}</Text>
          </View>
          <Text className={styles.subText}>昨日 ¥7,800</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>📊</Text>
            入住率
          </Text>
          <View>
            <Text className={styles.value}>{(statsData.occupancyRate * 100).toFixed(0)}%</Text>
            <Text className={styles.unit}></Text>
          </View>
          <Text className={styles.subText}>本月平均 72%</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.label}>
            <Text className={styles.icon}>📝</Text>
            今日入住
          </Text>
          <View>
            <Text className={styles.value}>{statsData.todayCheckIns}</Text>
            <Text className={styles.unit}>间</Text>
          </View>
          <Text className={styles.subText}>退房 {statsData.todayCheckOuts} 间</Text>
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
                  <View className={styles.bar} style={{ height: `${heightPercent}%` }}>
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
