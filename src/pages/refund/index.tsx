import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { getStatusText, formatPrice } from '@/utils';
import classnames from 'classnames';

type FilterType = 'all' | 'pending' | 'approved' | 'refunded' | 'rejected';

const RefundPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkType, setRemarkType] = useState<'approve' | 'reject' | null>(null);
  const [currentRefundId, setCurrentRefundId] = useState<string | null>(null);
  const [remark, setRemark] = useState('');

  const refundRequests = useAppStore(state => state.refundRequests);
  const approveRefund = useAppStore(state => state.approveRefund);
  const rejectRefund = useAppStore(state => state.rejectRefund);
  const confirmRefund = useAppStore(state => state.confirmRefund);
  const hydrate = useAppStore(state => state.hydrate);

  useDidShow(() => {
    hydrate();
  });

  const tabs: { id: FilterType; name: string }[] = [
    { id: 'all', name: '全部' },
    { id: 'pending', name: '待处理' },
    { id: 'approved', name: '已批准' },
    { id: 'refunded', name: '已退款' },
    { id: 'rejected', name: '已拒绝' }
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
    const pending = refundRequests.filter(r => r.status === 'pending').length;
    const total = refundRequests.length;
    const refunded = refundRequests.filter(r => r.status === 'refunded').length;
    const approved = refundRequests.filter(r => r.status === 'approved').length;
    const rejected = refundRequests.filter(r => r.status === 'rejected').length;
    return { pending, total, refunded, approved, rejected };
  }, [refundRequests]);

  const filterCounts = useMemo(() => {
    return {
      all: refundRequests.length,
      pending: refundRequests.filter(r => r.status === 'pending').length,
      approved: refundRequests.filter(r => r.status === 'approved').length,
      refunded: refundRequests.filter(r => r.status === 'refunded').length,
      rejected: refundRequests.filter(r => r.status === 'rejected').length
    };
  }, [refundRequests]);

  const filteredRefunds = useMemo(() => {
    if (filter === 'all') return refundRequests;
    return refundRequests.filter(r => r.status === filter);
  }, [filter, refundRequests]);

  const handleApprove = useCallback((id: string) => {
    console.log('[Refund] 批准退订:', id);
    setCurrentRefundId(id);
    setRemarkType('approve');
    setRemark('');
    setShowRemarkModal(true);
  }, []);

  const handleReject = useCallback((id: string) => {
    console.log('[Refund] 拒绝退订:', id);
    setCurrentRefundId(id);
    setRemarkType('reject');
    setRemark('');
    setShowRemarkModal(true);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!currentRefundId || !remarkType) return;

    if (remarkType === 'approve') {
      approveRefund(currentRefundId, remark || '审核通过');
      Taro.showToast({ title: '已批准', icon: 'success' });
    } else {
      rejectRefund(currentRefundId, remark || '不符合退订条件');
      Taro.showToast({ title: '已拒绝', icon: 'none' });
    }

    setShowRemarkModal(false);
    setCurrentRefundId(null);
    setRemarkType(null);
  }, [currentRefundId, remarkType, remark, approveRefund, rejectRefund]);

  const handleRefund = useCallback((id: string) => {
    console.log('[Refund] 确认退款:', id);
    Taro.showModal({
      title: '确认退款',
      content: '确定已完成退款操作吗？退款后将恢复对应库存。',
      success: res => {
        if (res.confirm) {
          confirmRefund(id);
          Taro.showToast({
            title: '退款完成',
            icon: 'success'
          });
        }
      }
    });
  }, [confirmRefund]);

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
            <Text className={styles.value}>{stats.approved}</Text>
            <Text className={styles.label}>待退款</Text>
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

      <ScrollView className={styles.tabs} scrollX>
        {tabs.map(tab => (
          <View
            key={tab.id}
            className={classnames(styles.tabItem, filter === tab.id && styles.active)}
            onClick={() => setFilter(tab.id)}
          >
            {tab.name}
            <Text className={styles.tabCount}>{filterCounts[tab.id]}</Text>
          </View>
        ))}
      </ScrollView>

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

      {showRemarkModal && (
        <View className={styles.modalMask}>
          <View className={styles.modal}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {remarkType === 'approve' ? '批准退订' : '拒绝退订'}
              </Text>
              <Text className={styles.modalClose} onClick={() => setShowRemarkModal(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>处理备注</Text>
                <Input
                  className={styles.formInput}
                  placeholder={remarkType === 'approve' ? '请输入批准备注（可选）' : '请输入拒绝原因'}
                  value={remark}
                  onInput={e => setRemark(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnCancel} onClick={() => setShowRemarkModal(false)}>取消</Button>
              <Button
                className={classnames(styles.modalBtnConfirm, remarkType === 'reject' && styles.danger)}
                onClick={handleConfirmAction}
              >
                {remarkType === 'approve' ? '确认批准' : '确认拒绝'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RefundPage;
