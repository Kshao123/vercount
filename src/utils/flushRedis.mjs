import { createClient } from "redis"

export const redis =  await createClient({ url: process.env.REDIS_URL }).connect();

// 定义清空 Redis 数据库的函数
async function flushRedis() {
	try {
		// 使用 FLUSHALL 命令清空所有数据库
		await redis.flushAll();
		console.log('Redis 所有数据库已清空');
	} catch (error) {
		console.error('清空 Redis 数据库时出错:', error);
	} finally {
		// 关闭 Redis 连接
		await redis.quit();
	}
}

// 调用函数清空 Redis 数据库
flushRedis();
