import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { refundRequests } from '@/data/stats';
import { getStatusText, formatPrice } from '@/utils';
import classnames from 'classnames';
import type { RefundRequest } from '@/types';

type FilterType = 'all' | 'pending' | 'approved' | 'refunded';

const RefundPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refunds, setRefunds] = useState<RefundRequest[]>(refundRequests);

  const tabs: { id: FilterType; name: string }[] = [
    { id: 'all', name: '全部' },
    { id: 'pending', name: '待处理' },
    { id: 'approved', name: '已批准' },
    { id: 'refunded', name: '已退款' }
  ];

  const reasonTypeNames: Record<string, string> = {
    typhoon: '台风停航',
    personal: '个人原因',
    other: '其他原因'
  };

  const orderTypeNames: Record<string, string> = {
    room: '房间预订',
    activity: '活动预约',
    dining: '餐饮预订'
  };

  const stats = useMemo(() => {
    const pending = refunds.filter(r => r.status === 'pending').length;
    const total = refunds.length;
    const refunded = refunds.filter(r => r.status === 'refunded').length;
    return { pending, total, refunded };
  }, [refunds]);

  const filteredRefunds = useMemo(() => {
    if (filter === 'all') return refunds;
    return refunds.filter(r => r.status === filter);
  }, [filter, refunds]);

  const handleApprove = useCallback((id: string) => {
    console.log('[Refund] 批准退订:', id);
    Taro.showModal({
      title: '确认批准',
      content: '确定批准该退订申请吗？',
      success: res => {
        if (res.confirm) {
          setRefunds(prev =>
            prev.map(r =>
              r.id === id
                ? { ...r, status: 'approved', handleTime: new Date().toISOString(), handleRemark: '审核通过，等待退款' }
                : r
            )
          );
          Taro.showToast({
            title: '已批准',
            icon: 'success'
          });
        }
      }
    });
  }, []);

  const handleReject = useCallback((id: string) => {
    console.log('[Refund] 拒绝退订:', id);
    Taro.showModal({
      title: '确认拒绝',
      content: '确定拒绝该退订申请吗？',
      success: res => {
        if (res.confirm) {
          setRefunds(prev =>
            prev.map(r =>
              r.id === id
                ? { ...r, status: 'rejected', handleTime: new Date().toISOString(), handleRemark: '不符合退订条件' }
                : r
            )
          );
          Taro.showToast({
            title: '已拒绝',
            icon: 'none'
          });
        }
      }
    });
  }, []);

  const handleRefund = useCallback((id: string) => {
    console.log('[Refund] 确认退款:', id);
    Taro.showModal({
      title: '确认退款',
      content: '确定已完成退款操作吗？',
      success: res => {
        if (res.confirm) {
          setRefunds(prev =>
            prev.map(r =>
              r.id === id
                ? { ...r, status: 'refunded', handleTime: new Date().toISOString(), handleRemark: '退款已完成' }
                : r
            )
          );
          Taro.showToast({
            title: '退款完成',
            icon: 'success'
          });
        }
      }
    });
  }, []);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>退订处理</Text>
        <Text className={styles.headerSubtitle}>台风停航退订 · 退款管理</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.pending}</Text>
            <Text className={styles.label}>待处理</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.refunded}</Text>
            <Text className={styles.label}>已退款</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.total}</Text>
            <Text className={styles.label}>总申请</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.id}
            className={classnames(styles.tabItem, filter === tab.id && styles.active)}
            onClick={() => setFilter(tab.id)}
          >
            {tab.name}
          </View>
        ))}
      </View>

      <View className={styles.refundList}>
        {filteredRefunds.length > 0 ? (
          filteredRefunds.map(refund => (
            <View key={refund.id} className={styles.refundCard}>
              <View className={styles.refundHeader}>
                <Text className={styles.orderNo}>订单号：{refund.orderNo}</Text>
                <View className={classnames(styles.refundStatus, styles[refund.status])}>
                  {getStatusText(refund.status, 'refund')}
                </View>
              </View>

              <View className={styles.orderTypeTag}>
                {orderTypeNames[refund.orderType]}
              </View>

              <View className={styles.guestInfo}>
                <View className={styles.guestAvatar}>👤</View>
                <View className={styles.guestDetail}>
                  <Text className={styles.guestName}>{refund.guestName}</Text>
                  <Text className={styles.guestPhone}>申请时间：{refund.createTime}</Text>
                </View>
              </View>

              <View className={styles.refundReason}>
                <Text className={styles.reasonType}>{reasonTypeNames[refund.reasonType]}</Text>
                <Text className={styles.reasonText}>{refund.reason}</Text>
              </View>

              <View className={styles.originalAmount}>
                <Text>原订单金额</Text>
                <Text>{formatPrice(refund.totalAmount)}</Text>
              </View>

              <View className={styles.refundAmount}>
                <Text className={styles.label}>申请退款金额</Text>
                <View className={styles.amount}>
                  <Text className={styles.symbol}>¥</Text>
                  <Text className={styles.value}>{refund.refundAmount}</Text>
                </View>
              </View>

              {refund.handleRemark && (
                <View className={styles.replySection}>
                  <Text className={styles.replyLabel}>处理备注</Text>
                  <Text className={styles.replyText}>{refund.handleRemark}</Text>
                </View>
              )}

              {refund.status === 'pending' && (
                <View className={styles.actionBtns}>
                  <Button
                    className={classnames(styles.actionBtn, styles.reject)}
                    onClick={() => handleReject(refund.id)}
                  >
                    拒绝
                  </Button>
                  <Button
                    className={classnames(styles.actionBtn, styles.approve)}
                    onClick={() => handleApprove(refund.id)}
                  >
                    批准
                  </Button>
                </View>
              )}

              {refund.status === 'approved' && (
                <View className={styles.actionBtns}>
                  <Button
                    className={classnames(styles.actionBtn, styles.refund)}
                    onClick={() => handleRefund(refund.id)}
                  >
                    确认退款
                  </Button>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.icon}>📋</View>
            <Text className={styles.text}>暂无退订申请</Text>
            <Text className={styles.subText}>有退订申请会在这里显示</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RefundPage;
