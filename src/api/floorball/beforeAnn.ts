import { defHttp } from '@/utils/http/axios';
import { GetPlayerModel } from './model/playerModel';

enum Api {
  Player = '/api/playerdata',
}

export const addPlayerApi = (params: GetPlayerModel) =>
  defHttp.post<any>({
    url: Api.Player,
    params,
    headers: {
      ignoreCancelToken: true,
    },
  });

export const deletePlayerApi = (id: number) =>
  defHttp.delete<any>({
    url: `${Api.Player}/${id}`, // 动态构建 URL，使用传入的 id
    headers: {
      ignoreCancelToken: true,
    },
  });

export const updatePlayerApi = (id: number, params: GetPlayerModel) =>
  defHttp.put<any>({
    url: `${Api.Player}/${id}`, // 动态构建 URL，使用传入的 id
    data: params, // 其他要更新的数据作为 data 传递
    headers: {
      ignoreCancelToken: true,
    },
  });

export const getPlayerApi = (id: number) =>
  defHttp.delete<any>({
    url: `${Api.Player}/${id}`, // 动态构建 URL，使用传入的 id
    headers: {
      ignoreCancelToken: true,
    },
  });

export const getAllPlayerApi = () =>
  defHttp.delete<any>({
    url: Api.Player,
    headers: {
      ignoreCancelToken: true,
    },
  });
