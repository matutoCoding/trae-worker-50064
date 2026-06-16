export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(0)}`;
};

export const formatDate = (date: string | Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateCN = (date: string): string => {
  const d = new Date(date);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = weekdays[d.getDay()];
  return `${month}月${day}日 ${weekday}`;
};

export const calcNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

export const getStatusText = (status: string, type: string = 'order'): string => {
  if (type === 'order') {
    const map: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      checkedIn: '已入住',
      checkedOut: '已退房',
      cancelled: '已取消',
      refunding: '退款中',
      refunded: '已退款'
    };
    return map[status] || status;
  }
  if (type === 'room') {
    const map: Record<string, string> = {
      clean: '干净',
      dirty: '待清洁',
      occupied: '已入住',
      maintenance: '维修中'
    };
    return map[status] || status;
  }
  if (type === 'ferry') {
    const map: Record<string, string> = {
      normal: '正常',
      delayed: '延误',
      cancelled: '取消'
    };
    return map[status] || status;
  }
  if (type === 'refund') {
    const map: Record<string, string> = {
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
      refunded: '已退款'
    };
    return map[status] || status;
  }
  return status;
};

export const getStatusColor = (status: string, type: string = 'order'): string => {
  if (type === 'room') {
    const map: Record<string, string> = {
      clean: '#2ecc71',
      dirty: '#f39c12',
      occupied: '#0088cc',
      maintenance: '#9b59b6'
    };
    return map[status] || '#8aa3bd';
  }
  if (type === 'order') {
    const map: Record<string, string> = {
      pending: '#f39c12',
      confirmed: '#0088cc',
      checkedIn: '#2ecc71',
      checkedOut: '#8aa3bd',
      cancelled: '#e74c3c',
      refunding: '#ff8c42',
      refunded: '#9b59b6'
    };
    return map[status] || '#8aa3bd';
  }
  if (type === 'ferry') {
    const map: Record<string, string> = {
      normal: '#2ecc71',
      delayed: '#f39c12',
      cancelled: '#e74c3c'
    };
    return map[status] || '#8aa3bd';
  }
  if (type === 'refund') {
    const map: Record<string, string> = {
      pending: '#f39c12',
      approved: '#2ecc71',
      rejected: '#e74c3c',
      refunded: '#9b59b6'
    };
    return map[status] || '#8aa3bd';
  }
  return '#8aa3bd';
};

export const renderStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalf) stars += '☆';
  return stars;
};
