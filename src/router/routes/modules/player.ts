// src/router/routes/modules/player.ts
import { RouteRecordRaw } from 'vue-router';
import { LAYOUT } from '@/router/constant';

const player: RouteRecordRaw = {
  path: '/player',
  name: 'PlayerManagement',
  component: LAYOUT,
  redirect: '/player/dashboard',
  meta: {
    orderNo: 20,
    icon: 'ion:person-outline',
    title: '运动员管理',
    hidden: true,
    ignoreAuth: true,
    hideChildrenInMenu: true,
    hideMenu: true,
  },

  children: [
    {
      path: 'dashboard/:playerId',
      name: 'PlayerDashboard',
      component: () => import('@/views/floorball/athletesData/player/PlayerDashboard.vue'),
      meta: {
        title: '运动员表现分析',
        hidden: true,
        ignoreAuth: true,
        hideMenu: true,
      },
      props: (route) => {
        const playerId = Number(route.params.playerId);
        return {
          playerId,
        };
      },
    },
  ],
};

export default player;
