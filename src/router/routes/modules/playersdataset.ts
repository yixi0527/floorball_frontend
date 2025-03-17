import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';

const playermanagment: AppRouteModule = {
  path: '/player',
  name: 'players',
  component: LAYOUT,
  redirect: '/players',
  meta: {
    hideChildrenInMenu: false,
    icon: 'ri:team-fill',
    title: '队伍管理',
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
        title: '历史竞赛',
        icon: 'ion:trophy-sharp',
        hideMenu: false,
        ignoreAuth: true,
      },
    },
  ],
};

export default playermanagment;
