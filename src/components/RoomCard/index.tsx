import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import type { RoomType } from '@/types';
import { formatPrice } from '@/utils';
import classnames from 'classnames';

interface RoomCardProps {
  room: RoomType;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <View className={styles.roomCard} onClick={onClick}>
      <Image className={styles.roomImage} src={room.image} mode='aspectFill' />
      <View className={styles.roomInfo}>
        <View className={styles.roomHeader}>
          <Text className={styles.roomName}>{room.name}</Text>
          {room.seaView && <View className={styles.tag}>海景</View>}
        </View>
        <Text className={styles.roomDesc}>{room.description}</Text>
        <View className={styles.roomMeta}>
          <Text className={styles.metaItem}>
            {room.bedType} · {room.size}㎡ · 可住{room.capacity}人
          </Text>
        </View>
        <View className={styles.roomFooter}>
          <View className={styles.priceWrap}>
            <Text className={styles.price}>{formatPrice(room.price)}</Text>
            {room.originalPrice && (
              <Text className={styles.originalPrice}>{formatPrice(room.originalPrice)}</Text>
            )}
            <Text className={styles.priceUnit}>/晚</Text>
          </View>
          <View className={classnames(styles.availability, room.availableCount > 0 ? styles.available : styles.full)}>
            {room.availableCount > 0 ? `剩${room.availableCount}间` : '已满房'}
          </View>
        </View>
      </View>
    </View>
  );
};

export default RoomCard;
