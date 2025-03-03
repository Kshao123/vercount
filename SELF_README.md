# 需知

1. busuanzi 统计 uv 会考虑 cookie，如不携带 ip 则 uv 会累增，所以可以不用考虑 Redis 过期时的 uv 处理

2. 目前保留有效期是避免 post 被删除仍有记录的情况
