import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store';
// 全局样式
import './app.scss';

function App(props) {
  const initStore = useAppStore(state => state.initStore);

  useEffect(() => {
    // 应用启动时初始化 store
    initStore();
    console.log('[App] Store initialized');
  }, []);

  // 对应 onShow
  useDidShow(() => {
    // 每次显示时恢复状态
    const hydrate = useAppStore.getState().hydrate;
    hydrate();
  });

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
