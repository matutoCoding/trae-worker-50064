import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'primary' | 'accent' | 'success' | 'warning';
  icon?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  color = 'primary',
  icon,
  onClick
}) => {
  return (
    <View className={classnames(styles.statCard, styles[color])} onClick={onClick}>
      {icon && <View className={styles.icon}>{icon}</View>}
      <View className={styles.content}>
        <Text className={styles.title}>{title}</Text>
        <View className={styles.valueRow}>
          <Text className={styles.value}>{value}</Text>
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        {trend && trendValue && (
          <View className={classnames(styles.trend, styles[trend])}>
            <Text>{trend === 'up' ? '↑' : '↓'} {trendValue}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default StatCard;
