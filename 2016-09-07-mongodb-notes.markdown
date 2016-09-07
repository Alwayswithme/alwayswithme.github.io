---
layout       :  post
title        :  "MongoDB 笔记"
date         :  2016-09-07 16:54:18
categories   :  jekyll update
---

MongoDB 使用备忘

### 备份[`mongodump`](https://docs.mongodb.com/manual/reference/program/mongodump/)
{% highlight sh %}
# 备份整个数据库并压缩为 gzip 包到指定路径
mongodump --archive=/tmp/mongodb.gz --db test --gzip --host <host>:<port>
# 备份整个数据库并压缩为 gzip 包到标准输入
mongodump --archive --db test --gzip --host <host>:<port>
{% endhighlight %}

### 恢复[`mongorestore`](https://docs.mongodb.com/manual/reference/program/mongorestore/)
{% highlight sh %}
# 从 gzip 压缩包中恢复，加 `--drop` 恢复前把旧数据 drop 掉
mongorestore --archive=/tmp/mongodb.gz --gzip --db test --drop
# 利用管道机制从标准输入中恢复数据库，相当于远程导入本地
mongodump --archive --db test  --host <remoteip> --gzip| mongorestore --archive --host localhost --drop --gzip
{% endhighlight %}

