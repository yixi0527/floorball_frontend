import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';

const parsevideo: AppRouteModule = {
  path: '/parsevideo',
  name: 'parsevideo',
  component: LAYOUT,
  redirect: '/parsevideoPage',
  meta: {
    hideChildrenInMenu: true,
    icon: 'ion:sparkles-sharp',
    title: '软曲赛事洞察',
    orderNo: 0,
    ignoreAuth: true,
  },
  children: [
    {
      path: '/parsevideoPage',
      name: 'parsevideoPage',
      component: () => import('@/views/floorball/parsevideo/index.vue'),
      meta: {
        title: '软曲赛事洞察',
        icon: 'simple-icons:aboutdotme',
        hideMenu: true,
        ignoreAuth: true,
      },
    },
  ],
};

export default parsevideo;
