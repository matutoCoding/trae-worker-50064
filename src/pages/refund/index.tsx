import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { getStatusText, formatPrice } from '@/utils';
import classnames from 'classnames';
import type { RefundRequest } from '@/types';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'refunding' | 'refunded';

type RefundStatus = RefundRequest['status'] | 'refunding';

const orderTypeConfig: Record<RefundRequest['orderType'], { icon: string; label: string; className: string }> = {
  room: { icon: '🛏️', label: '客房预订', className: 'room' },
  activity: { icon: '🎯', label: '活动预约', className: 'activity' },
  dining: { icon: '🍽️', label: '餐饮预订', className: 'dining' }
};

const reasonTypeNames: Record<RefundRequest['reasonType'], string> = {
  typhoon: '台风停航',
  personal: '个人原因',
  other: '其他原因'
};

const getRefundStatusText = (status: RefundRequest['status']): string => {
  const map: Record<RefundRequest['status'], string> = {
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    refunded: '已退款'
  };
  return map[status] || status;
};

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
    { id: 'rejected', name: '已拒绝' },
    { id: 'refunding', name: '退款中' },
    { id: 'refunded', name: '已退款' }
  ];

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
      rejected: refundRequests.filter(r => r.status === 'rejected').length,
      refunding: refundRequests.filter(r => r.status === 'approved').length,
      refunded: refundRequests.filter(r => r.status === 'refunded').length
    };
  }, [refundRequests]);

  const filteredRefunds = useMemo(() => {
    if (filter === 'all') return refundRequests;
    if (filter === 'refunding') return refundRequests.filter(r => r.status === 'approved');
    return refundRequests.filter(r => r.status === filter);
  }, [filter, refundRequests]);

  const handleApprove = useCallback((id: string) => {
    setCurrentRefundId(id);
    setRemarkType('approve');
    setRemark('');
    setShowRemarkModal(true);
  }, []);

  const handleReject = useCallback((id: string) => {
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

  const renderActionButtons = (refund: RefundRequest) => {
    if (refund.status === 'pending') {
      return (
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
      );
    }
    if (refund.status === 'approved') {
      return (
        <View className={styles.actionBtns}>
          <Button
            className={classnames(styles.actionBtn, styles.refund)}
            onClick={() => handleRefund(refund.id)}
          >
            确认退款
          </Button>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>退订处理</Text>
        <Text className={styles.headerSubtitle}>台风停航退订 · 退款管理</Text>
        <View className={styles.statsRow}>
          <View className={classnames(styles.statItem, styles.statPending)}>
            <Text className={styles.statIcon}>⏳</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.pending}</Text>
              <Text className={styles.statLabel}>待处理</Text>
            </View>
          </View>
          <View className={classnames(styles.statItem, styles.statApproved)}>
            <Text className={styles.statIcon}>💰</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.approved}</Text>
              <Text className={styles.statLabel}>待退款</Text>
            </View>
          </View>
          <View className={classnames(styles.statItem, styles.statRefunded)}>
            <Text className={styles.statIcon}>✅</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.refunded}</Text>
              <Text className={styles.statLabel}>已退款</Text>
            </View>
          </View>
          <View className={classnames(styles.statItem, styles.statTotal)}>
            <Text className={styles.statIcon}>📋</Text>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.total}</Text>
              <Text className={styles.statLabel}>总申请</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className={styles.tabs} scrollX>
        {tabs.map(tab => (
          <View
            key={tab.id}
            className={classnames(styles.tabItem, filter === tab.id && styles.tabActive)}
            onClick={() => setFilter(tab.id)}
          >
            <Text className={styles.tabText}>{tab.name}</Text>
            {filterCounts[tab.id] > 0 && (
              <View className={classnames(styles.tabBadge, filter === tab.id && styles.badgeActive)}>
                <Text className={styles.badgeText}>
                  {filterCounts[tab.id] > 99 ? '99+' : filterCounts[tab.id]}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View className={styles.refundList}>
        {filteredRefunds.length > 0 ? (
          filteredRefunds.map(refund => {
            const typeConfig = orderTypeConfig[refund.orderType];
            return (
              <View
                key={refund.id}
                className={classnames(
                  styles.refundCard,
                  styles[`cardBorder_${refund.status}`]
                )}
              >
                <View className={styles.cardHeader}>
                  <View className={styles.orderTypeTag}>
                    <Text className={styles.typeIcon}>{typeConfig.icon}</Text>
                    <Text className={classnames(styles.typeLabel, styles[typeConfig.className])}>
                      {typeConfig.label}
                    </Text>
                  </View>
                  <View className={classnames(styles.refundStatus, styles[`status_${refund.status}`])}>
                    <Text className={styles.statusText}>
                      {filter === 'refunding' ? '退款中' : getRefundStatusText(refund.status)}
                    </Text>
                  </View>
                </View>

                <View className={styles.orderInfoRow}>
                  <Text className={styles.orderNoLabel}>订单号</Text>
                  <Text className={styles.orderNoValue}>{refund.orderNo}</Text>
                </View>

                <View className={styles.guestInfo}>
                  <View className={styles.guestAvatar}>
                    <Text className={styles.avatarText}>👤</Text>
                  </View>
                  <View className={styles.guestDetail}>
                    <Text className={styles.guestName}>{refund.guestName}</Text>
                    <Text className={styles.applyTime}>申请时间：{refund.createTime}</Text>
                  </View>
                </View>

                <View className={styles.refundReason}>
                  <View className={styles.reasonHeader}>
                    <View className={styles.reasonTag}>
                      <Text className={styles.reasonTagText}>{reasonTypeNames[refund.reasonType]}</Text>
                    </View>
                  </View>
                  <Text className={styles.reasonText}>{refund.reason}</Text>
                </View>

                <View className={styles.amountSection}>
                  <View className={styles.amountRow}>
                    <Text className={styles.amountLabel}>原订单金额</Text>
                    <Text className={styles.originalAmount}>{formatPrice(refund.totalAmount)}</Text>
                  </View>
                  <View className={styles.amountRowHighlight}>
                    <Text className={styles.amountLabel}>申请退款金额</Text>
                    <View className={styles.refundAmountBox}>
                      <Text className={styles.currencySymbol}>¥</Text>
                      <Text className={styles.refundAmountValue}>{refund.refundAmount}</Text>
                    </View>
                  </View>
                </View>

                {refund.handleRemark && (
                  <View className={styles.handleRemark}>
                    <Text className={styles.remarkLabel}>
                      {refund.status === 'refunded' ? '退款备注' : '处理备注'}
                    </Text>
                    <Text className={styles.remarkText}>{refund.handleRemark}</Text>
                    {refund.handleTime && (
                      <Text className={styles.handleTime}>处理时间：{refund.handleTime}</Text>
                    )}
                  </View>
                )}

                {renderActionButtons(refund)}
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>
              <Text className={styles.emptyEmoji}>📭</Text>
            </View>
            <Text className={styles.emptyTitle}>暂无退订申请</Text>
            <Text className={styles.emptySubtitle}>有退订申请会在这里显示</Text>
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
              <View className={styles.modalCloseBtn} onClick={() => setShowRemarkModal(false)}>
                <Text className={styles.closeIcon}>×</Text>
              </View>
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
              <Button
                className={styles.modalBtnCancel}
                onClick={() => setShowRemarkModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(
                  styles.modalBtnConfirm,
                  remarkType === 'reject' && styles.btnDanger
                )}
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
