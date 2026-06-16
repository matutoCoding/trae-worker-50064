import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { dishes } from '@/data/dining';
import { formatPrice } from '@/utils';
import classnames from 'classnames';

type CategoryType = 'all' | '海鲜主菜' | '海鲜热菜' | '主食粥品' | '汤品' | '素菜' | '甜点';

const DiningPage: React.FC = () => {
  const [category, setCategory] = useState<CategoryType>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bookingDate, setBookingDate] = useState('2026-06-17');
  const [bookingTime, setBookingTime] = useState('18:30');

  const categories: { id: CategoryType; name: string }[] = [
    { id: 'all', name: '全部' },
    { id: '海鲜主菜', name: '海鲜主菜' },
    { id: '海鲜热菜', name: '海鲜热菜' },
    { id: '主食粥品', name: '主食粥品' },
    { id: '汤品', name: '汤品' },
    { id: '素菜', name: '素菜' },
    { id: '甜点', name: '甜点' }
  ];

  const filteredDishes = useMemo(() => {
    if (category === 'all') return dishes;
    return dishes.filter(d => d.category === category);
  }, [category]);

  const totalInfo = useMemo(() => {
    let totalCount = 0;
    let totalPrice = 0;
    Object.keys(quantities).forEach(dishId => {
      const qty = quantities[dishId] || 0;
      const dish = dishes.find(d => d.id === dishId);
      if (dish && qty > 0) {
        totalCount += qty;
        totalPrice += dish.price * qty;
      }
    });
    return { totalCount, totalPrice };
  }, [quantities]);

  const handleQuantityChange = useCallback((dishId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dishId]: next };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    console.log('[Dining] 提交预订', totalInfo);
    if (totalInfo.totalCount === 0) {
      Taro.showToast({
        title: '请先选择菜品',
        icon: 'none'
      });
      return;
    }
    Taro.showModal({
      title: '确认预订',
      content: `共${totalInfo.totalCount}份菜品，合计¥${totalInfo.totalPrice}，确定提交预订吗？`,
      success: res => {
        if (res.confirm) {
          Taro.showToast({
            title: '预订成功',
            icon: 'success'
          });
          setQuantities({});
        }
      }
    });
  }, [totalInfo]);

  const handleDateChange = useCallback(() => {
    Taro.showToast({
      title: '日期选择开发中',
      icon: 'none'
    });
  }, []);

  const handleTimeChange = useCallback(() => {
    Taro.showToast({
      title: '时间选择开发中',
      icon: 'none'
    });
  }, []);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>海鲜餐厅</Text>
        <Text className={styles.headerSubtitle}>新鲜海捕 · 现捞现做 · 海岛美味</Text>

        <View className={styles.bookingBar}>
          <View className={styles.bookingItem} onClick={handleDateChange}>
            <Text className={styles.label}>用餐日期</Text>
            <Text className={styles.value}>{bookingDate}</Text>
          </View>
          <View className={styles.bookingDivider} />
          <View className={styles.bookingItem} onClick={handleTimeChange}>
            <Text className={styles.label}>用餐时间</Text>
            <Text className={styles.value}>{bookingTime}</Text>
          </View>
          <View className={styles.bookingDivider} />
          <View className={styles.bookingItem} onClick={() => Taro.showToast({ title: '人数选择开发中', icon: 'none' })}>
            <Text className={styles.label}>用餐人数</Text>
            <Text className={styles.value}>2人</Text>
          </View>
        </View>
      </View>

      <ScrollView className={styles.categories} scrollX>
        {categories.map(cat => (
          <View
            key={cat.id}
            className={classnames(styles.categoryItem, category === cat.id && styles.active)}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </View>
        ))}
      </ScrollView>

      <ScrollView className={styles.dishList} scrollY>
        {filteredDishes.length > 0 ? (
          filteredDishes.map(dish => {
            const qty = quantities[dish.id] || 0;
            return (
              <View key={dish.id} className={styles.dishCard}>
                <View className={styles.dishImage}>
                  <Image src={dish.image} mode='aspectFill' />
                  {dish.isRecommended && (
                    <View className={styles.recommendTag}>招牌</View>
                  )}
                  {dish.isSpicy && (
                    <View className={styles.spicyTag}>🌶️辣</View>
                  )}
                </View>
                <View className={styles.dishInfo}>
                  <Text className={styles.dishName}>{dish.name}</Text>
                  <Text className={styles.dishDesc}>{dish.description}</Text>
                  <View className={styles.dishFooter}>
                    <View className={styles.dishPrice}>
                      <Text className={styles.symbol}>¥</Text>
                      <Text className={styles.price}>{dish.price}</Text>
                      <Text className={styles.unit}>/份</Text>
                    </View>
                    <View className={styles.quantityControl}>
                      {qty > 0 && (
                        <>
                          <Button
                            className={styles.quantityBtn}
                            onClick={() => handleQuantityChange(dish.id, -1)}
                          >
                            -
                          </Button>
                          <Text className={styles.quantityValue}>{qty}</Text>
                        </>
                      )}
                      <Button
                        className={classnames(styles.quantityBtn, styles.add)}
                        onClick={() => handleQuantityChange(dish.id, 1)}
                      >
                        +
                      </Button>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.icon}>🍽️</View>
            <Text className={styles.text}>暂无相关菜品</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <View className={styles.totalPrice}>
            <Text className={styles.symbol}>¥</Text>
            <Text className={styles.price}>{totalInfo.totalPrice}</Text>
          </View>
          <Text className={styles.totalCount}>共{totalInfo.totalCount}份菜品</Text>
        </View>
        <Button
          className={classnames(styles.submitBtn, totalInfo.totalCount === 0 && styles.disabled)}
          disabled={totalInfo.totalCount === 0}
          onClick={handleSubmit}
        >
          立即预订
        </Button>
      </View>
    </View>
  );
};

export default DiningPage;
