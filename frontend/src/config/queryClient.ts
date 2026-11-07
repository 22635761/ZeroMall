import { QueryClient } from '@tanstack/react-query'

/**
 * Cấu hình toàn cục cho TanStack Query nhằm ngăn chặn hoàn toàn
 * tình trạng spam API dư thừa khi người dùng chuyển đổi qua lại giữa các trang.
 *
 * - staleTime: 5 phút (dữ liệu được coi là tươi mới, không fetch lại khi mount lại component)
 * - gcTime: 30 phút (lưu trữ trong bộ nhớ tạm thời gian dài để back/forward tức thì)
 * - refetchOnWindowFocus: false (không refetch khi click qua tab khác)
 * - refetchOnMount: false (nếu dữ liệu còn trong staleTime thì không gọi lại API)
 * - refetchOnReconnect: false
 * - retry: 1 (thử lại tối đa 1 lần nếu network chập chờn)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút
      gcTime: 1000 * 60 * 30, // 30 phút
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
})
