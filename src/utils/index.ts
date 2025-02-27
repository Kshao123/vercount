import { EXPIRATION_TIME, EXPIRATION_TIME_POST } from '@/lib/get-busuanzi-data'

export function getExpirationTime(path: string) {
  const isPost = path.includes('post');
  return isPost ? EXPIRATION_TIME_POST : EXPIRATION_TIME
}
