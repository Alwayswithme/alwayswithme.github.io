---
layout       :  post
title        :  "分布式锁"
date         :  2017-06-09 09:44:22
categories   :  java distributed
---

## 分布式锁

在分布式系统中，如多个实例或集群节点中，要有一种方式来保证同步共享资源的访问。此时编程语言提供的锁同步便无能为力，这时就需要用到分布式锁，分布式锁常用于：

1. 保证计算效率：通过锁互斥避免消耗大量资源的重复计算，具体场景：防止并发请求
2. 保证数据一致：保证同一份数据每次只有一个进程修改，具体场景：下单减库存

### 思路

简单来说可以分为三步操作

1. 获取锁，此时有可能获取失败可加入重试或阻塞逻辑
2. 执行具体操作
3. 释放锁，此时要判断可能存在超时自动释放的逻辑

### 实现方式

根据系统架构和技术栈的不同，实现方式可以分为：

#### 数据库的乐观锁或排它锁

乐观锁一般是指增加一个版本号，修改数据时每次都会更新版本号，保证只有一次修改。
排它锁，利用 `SELECT ... FROM ... FOR UPDATE` 的语法选择一行数据上排他锁，其他事务在执行这条语句会阻塞。另外，可以把数据库引擎改为 InnoDB 并用上唯一索引将锁优化为行锁。

#### 缓存的原子性操作

[MemCache][Memcached] 的 `[ADD](https://github.com/memcached/memcached/wiki/Commands#add)` 命令，这个命令的作用是只有 key 不存在时才添加，可以认为获得了锁。
[Redis][Redis] 的 `[SET](https://redis.io/commands/set)` 也类似，没有看错，Redis 2.6.12 之后的版本 `SET` 命令可以添加 NX 选项来替代 `SETNX` 。鉴于大量资料还是用 `SETNX`, `GETSET` 等命令组合来检查时间戳加锁，这里有必要提一下。两种方式分别在两个 Redis 命令文档的下面可以查阅。 

1. 新的实现方式 `SET` 配合 Lua 脚本：https://redis.io/commands/set
2. 旧的实现方式 `SETNX`, `GET ` 和 `GETSET`: https://redis.io/commands/setnx 


#### ZooKeeper 临时节点

基于 [ZooKeeper][ZooKeeper] 创建临时有序节点，锁可以认为是由创建最小序号的节点进程获取，释放锁删除创建的有序临时节点即可。

### 利用 MemCache 和 Spring AOP 的简单实现

先写一个简单的类，这个类是无状态的，很适合作为Spring 的 Bean。可以看作是一个 LockService

```java
public class MemCacheLock {

	private MemCachedClient client;

	public MemCacheLock(MemCachedClient client) {
		this.client = client;
	}

	/**
	 * 通过 add(lockKey, token) 获取锁
	 *
	 * @param lockKey 上锁的 key
	 * @param retry 重试次数
	 * @param expireSec 过期时间，单位秒
	 * @param token key 对应的 value, 删除时比对避免释放其他客户端的锁
	 * @return
	 */
	public boolean acquire(String lockKey, int retry, int expireSec, String token) {
		// anyMatch 迭代 retry + 1 次，直到成功获取锁
		return IntStream.rangeClosed(0, retry).anyMatch((i) -> {
			// 第一次获取锁不等待，随后的重试等待 100 ms
			try {
				TimeUnit.MILLISECONDS.sleep(i > 0 ? 100 : 0);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			return client.add(lockKey, token, new Date(expireSec * 1000));
		});
	}

	/**
	 * 通过 del(lockKey) 释放锁
	 *
	 * @param lockKey 上锁的 key
	 * @param token key 对应的 value
	 * @return
	 */
	public boolean release(String lockKey, String token) {
		Object obj = client.get(lockKey);
		String get = "";
		if (obj instanceof String) {
			get = (String) obj;
		}
		// 通过 token 保证不会释放其他客户端的锁
		return Objects.equals(get, token) && client.delete(lockKey);
	}
}
```

因为 `acquire` 和 `release` 总是配合使用，可以利用模板方法在切面里应用，定义一个 annotation 和 aspect

```java
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DistributedLock {

	/**
	 * 省略 default 要显示指定一个key
	 */
	String key();

	int expired() default 10;

	int acquireRetry() default 3;
}

@Aspect
@Component
public class DistributedLockAspect {

	@Autowired
	MemCacheLock lockService;

	@Around("@annotation(distributedLock)")
	public Object runWithLock(ProceedingJoinPoint pjp, DistributedLock distributedLock) throws Throwable {
		int expired = distributedLock.expired();
		int retry = distributedLock.acquireRetry();
		String key = "dist_lock_" + distributedLock.key();

		long l = (System.currentTimeMillis() / 1000) + Thread.currentThread().hashCode();
		String token = String.valueOf(l);

		boolean acquired = false;
		try {
			acquired = lockService.acquire(key, retry, expired, token);
			if (acquired) {
				return pjp.proceed();
			}
		} finally {
			if (acquired) {
				lockService.release(key, token);
			}
		}

		throw new RuntimeException("can not acquire lock");
	}
}
```

随后在 service 和 dao 方法中，标注上 `@DistributedLock(key="test")` 便能上锁，但是要注意这里如果无法获取锁会抛出异常

### Redlock

Redis 官方提出的一种分布式锁算法 [Redlock](https://github.com/antirez/redis-doc/blob/master/topics/distlock.md)，但可以在文档的[最后](https://github.com/antirez/redis-doc/blob/master/topics/distlock.md#analysis-of-redlock)看到有一些有意思的讨论，分析 Redlock 是否靠谱。

https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
http://antirez.com/news/101

### 其他更健壮的实现

* [Redisson][]: 可以作为 Redis Java 客户端，提供了分布式锁和和同步器，API非常友好，中文 Wiki 也非常完善
* [Curator][]: 一个更高层抽象的 ZooKeeper 客户端，其中的 InterProcessMutex 便是分布式锁

### 相关链接
http://www.hollischuang.com/archives/1716
http://www.importnew.com/20307.html
https://russellneufeld.wordpress.com/2012/05/24/using-memcached-as-a-distributed-lock-from-within-django/
https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/chubby-osdi06.pdf

[Redisson]: https://redisson.org/
[Curator]: https://curator.apache.org/
[ZooKeeper]: https://github.com/apache/zookeeper
[Redis]: https://github.com/antirez/redis
[Memcached]: https://github.com/memcached/memcached