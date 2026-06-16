import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { activities } from '@/data/activities';
import { formatPrice } from '@/utils';
import classnames from 'classnames';

type FilterType = 'all' | 'diving' | 'snorkeling' | 'fishing' | 'kayaking';

const ActivityPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

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
  }, [filter]);

  const handleBook = useCallback((activityId: string, activityName: string) => {
    console.log('[Activity] 预约活动:', activityId, activityName);
    Taro.showModal({
      title: '确认预约',
      content: `确定要预约「${activityName}」吗？`,
      success: res => {
        if (res.confirm) {
          Taro.showToast({
            title: '预约成功',
            icon: 'success'
          });
        }
      }
    });
  }, []);

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
      </View>
    </ScrollView>
  );
};

export default ActivityPage;
