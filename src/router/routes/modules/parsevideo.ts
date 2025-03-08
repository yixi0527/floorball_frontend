import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';


const parsevideo: AppRouteModule = {
  path: '/parsevideo',
  name: 'parsevideo',
  component: LAYOUT,
  redirect: '/parsevideoPage',
  meta: {
    hideChildrenInMenu: true,
    icon: 'simple-icons:aboutdotme',
    title: '智能分析',
    orderNo: 0,
  },
  children: [
    {
      path: '/parsevideoPage',
      name: 'parsevideoPage',
      component: () => import('@/views/floorball/parsevideo/index.vue'),
      meta: {
        title: '智能分析',
        icon: 'simple-icons:aboutdotme',
        hideMenu: true,
      },
    },
  ],
};

export default parsevideo;
