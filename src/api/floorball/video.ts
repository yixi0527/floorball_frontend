import { defHttp } from '@/utils/http/axios';

enum Api {
  UPLOADVIDEO = '/api/upload/',
}

/**
 * @description: Get sample list value
 */

export const uploadVideoApi = (params: DemoParams) =>
  defHttp.get<DemoListGetResultModel>({
    url: Api.DEMO_LIST,
    params,
    headers: {
      // @ts-ignore
      ignoreCancelToken: true,
    },
  });
