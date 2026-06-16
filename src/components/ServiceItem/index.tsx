import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { ServiceEntry } from '@/types';

interface ServiceItemProps {
  service: ServiceEntry;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ service }) => {
  const handleClick = () => {
    Taro.navigateTo({
      url: service.pagePath
    }).catch(err => {
      console.error('[ServiceItem] 导航失败:', err);
    });
  };

  return (
    <View className={styles.serviceItem} onClick={handleClick}>
      <View className={styles.iconWrap} style={{ background: service.bgColor }}>
        <Text className={styles.icon}>{service.icon}</Text>
      </View>
      <View className={styles.info}>
        <Text className={styles.name}>{service.name}</Text>
        <Text className={styles.desc}>{service.description}</Text>
      </View>
      <Text className={styles.arrow}>›</Text>
    </View>
  );
};

export default ServiceItem;
