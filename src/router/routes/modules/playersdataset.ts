import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';

const playermanagment: AppRouteModule = {
  path: '/player',
  name: 'players',
  component: LAYOUT,
  redirect: '/players',
  meta: {
    hideChildrenInMenu: true,
    icon: 'simple-icons:aboutdotme',
    title: '队员管理',
    orderNo: 0,
  },
  children: [
    {
      path: '/players',
      name: 'players',
      component: () => import('@/views/floorball/dataset/playerTable.vue'),
      meta: {
        title: '队员管理',
        icon: 'simple-icons:aboutdotme',
        hideMenu: true,
      },
    },
  ],
};

export default playermanagment;
