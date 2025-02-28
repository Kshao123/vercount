# 需知

1. busuanzi 统计 uv 会考虑 cookie，如不携带 ip 则 uv 会累增，所以可以不用考虑 Redis 过期时的 uv 处理

sync 有 cookie 所以不会增加，但也会有问题
[//]: # (但是 uv 正是因为这样，切换到新系统时，每次的 Sync 都会触发 uv 的变更)
