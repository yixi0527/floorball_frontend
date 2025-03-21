import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';

const playermanagment: AppRouteModule = {
  path: '/player',
  name: 'players',
  component: LAYOUT,
  redirect: '/players',
  meta: {
    hideChildrenInMenu: false,
    icon: 'ant-design:database-outlined',
    title: '数据中心',
    orderNo: 0,
    ignoreAuth: true,
  },
  children: [
    {
      path: '/playersList',
      name: 'playersList',
      component: () => import('@/views/floorball/dataset/playerTable.vue'),
      meta: {
        title: '队员数据',
        icon: 'ion:people-circle-sharp',
        hideMenu: false,
        ignoreAuth: true,
      },
    },
    {
      path: '/taskList',
      name: 'taskList',
      component: () => import('@/views/floorball/dataset/taskTable.vue'),
      meta: {
        title: '历史赛事',
        icon: 'ion:trophy-sharp',
        hideMenu: false,
        ignoreAuth: true,
      },
    },
  ],
};

export default playermanagment;
