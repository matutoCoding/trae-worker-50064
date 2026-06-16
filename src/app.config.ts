export default defineAppConfig({
  pages: [
    'pages/booking/index',
    'pages/service/index',
    'pages/room/index',
    'pages/stats/index',
    'pages/ferry/index',
    'pages/activity/index',
    'pages/dining/index',
    'pages/refund/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0088cc',
    navigationBarTitleText: '海岛民宿',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f0f7fb'
  },
  tabBar: {
    color: '#8aa3bd',
    selectedColor: '#0088cc',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/booking/index',
        text: '房态预订'
      },
      {
        pagePath: 'pages/service/index',
        text: '服务中心'
      },
      {
        pagePath: 'pages/room/index',
        text: '房间管理'
      },
      {
        pagePath: 'pages/stats/index',
        text: '收益统计'
      }
    ]
  }
})
