import React, { useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { serviceEntries } from '@/data/activities';
import ServiceItem from '@/components/ServiceItem';

const ServicePage: React.FC = () => {
  const handleServiceClick = useCallback((pagePath: string) => {
    console.log('[Service] 点击服务:', pagePath);
    Taro.navigateTo({
      url: pagePath
    }).catch(err => {
      console.error('[Service] 导航失败:', err);
    });
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    console.log('[Service] 快捷操作:', action);
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }, []);

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled>
      <View className={styles.banner}>
        <Text className={styles.bannerTitle}>服务中心</Text>
        <Text className={styles.bannerDesc}>一站式海岛服务，尽享惬意假期</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.icon}>🎯</Text>
          <Text>服务项目</Text>
        </View>

        <View className={styles.serviceGrid}>
          {serviceEntries.map(service => (
            <View
              key={service.id}
              className={styles.serviceGridItem}
              onClick={() => handleServiceClick(service.pagePath)}
            >
              <View className={styles.serviceGridIcon} style={{ background: service.bgColor }}>
                <Text>{service.icon}</Text>
              </View>
              <View className={styles.serviceGridInfo}>
                <Text className={styles.serviceGridName}>{service.name}</Text>
                <Text className={styles.serviceGridDesc}>{service.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.icon}>💡</Text>
          <View className={styles.content}>
            <Text className={styles.title}>温馨提示</Text>
            <Text className={styles.desc}>
              如遇台风等恶劣天气，轮渡可能停航。请提前关注天气信息，如需退订可在退订处理中申请。
            </Text>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <Text className={styles.icon}>⚡</Text>
          <Text>快捷服务</Text>
        </View>

        <View className={styles.quickActions}>
          <View className={styles.quickAction} onClick={() => handleQuickAction('contact')}>
            <View className={styles.icon}>📞</View>
            <Text className={styles.name}>联系客服</Text>
          </View>
          <View className={styles.quickAction} onClick={() => handleQuickAction('weather')}>
            <View className={styles.icon}>🌤️</View>
            <Text className={styles.name}>天气预报</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ServicePage;
