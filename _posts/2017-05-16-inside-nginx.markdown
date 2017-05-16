---
layout       :  post
title        :  "译：Inside NGINX: How We Designed for Performance & Scale"
date         :  2017-05-16 21:16:49
categories   :  nginx
---

NGINX 的官方博客有不少高质量的文章，其中一篇高屋建瓴的介绍了 NGINX 的架构。NGINX 的设计使用了 [Reactor 模式](https://en.wikipedia.org/wiki/Reactor_pattern), 下面提到的 master 和 worker 即所谓的 MainReactor 和 SubReactor, 意会即可。

> 原文链接：[Inside NGINX: How We Designed for Performance & Scale](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/)

## 深入 NGINX: 性能与拓展

NGINX 能在 web 性能上独树一帜归功于它软件的设计方式。鉴于大部分 web 服务器和应用服务器使用简单线程/进程架构, 精致的事件驱动模型使得 NGINX 脱颖而出, 令它能在现代的硬件上处理成千上万的并发连接。

这份 [Inside NGINX][infographic] 信息图从高级的进程架构切入, 描述 NGINX 是如何以单一进程处理多个连接。 本文更详细地解释它是如何工作的。

###  好戏开场, NGINX 进程模型

![Master Process](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.36.30-PM.png "the NGINX master Process and Child Processes")

了解 NGINX 是如何运行的将有助于你更好理解这个设计。 NGINX 有一个 master 进程(负责执行像读取配置和绑定端口这样的权限操作) 和一系列 worker 进程和 helper 进程。

```terminal
# service nginx restart
* Restarting nginx
# ps -ef --forest | grep nginx
root     32475     1  0 13:36 ?        00:00:00 nginx: master process /usr/sbin/nginx \
                                                -c /etc/nginx/nginx.conf
nginx    32476 32475  0 13:36 ?        00:00:00  \_ nginx: worker process
nginx    32477 32475  0 13:36 ?        00:00:00  \_ nginx: worker process
nginx    32479 32475  0 13:36 ?        00:00:00  \_ nginx: worker process
nginx    32480 32475  0 13:36 ?        00:00:00  \_ nginx: worker process
nginx    32481 32475  0 13:36 ?        00:00:00  \_ nginx: cache manager process
nginx    32482 32475  0 13:36 ?        00:00:00  \_ nginx: cache loader process
```

在这台四核服务器， NGINX 的 master 进程创建了四个 worker 进程和一系列缓存 helper 进程负责管理磁盘上的内容缓存。

###  为什么架构很重要？

一切 Unix 程序的基本单元都是线程和进程。(从 Linux 操作系统来说, 线程和进程是大体相似的；主要区别在于它们共享内存的程度。) 一个线程或进程是一组由 CPU 调度在一个核芯上运行的独立指令集。 大部分复杂的程序并行运行多个线程或进程，原因有二：

  * 可以同时使用更多计算核芯
  * 可以让并行操作简单的进行(举例来说，同时处理多个连接)。

进程和线程会消耗资源。它们都要用到内存和其他操作系统资源，而且调度时需要在核芯中装入和移出(一种叫上下文切换的操作)。多数现代的服务器可以同时处理数百个的小型，活跃的线程和进程，不过一旦内存用尽或者 I/O 负载很高导致大量的上下文切换性能将严重下降。

网络程序的常用设计方式是为每一个连接分配一个线程或进程。这种架构很简单而且方便实现, 但难以拓展至处理成千上万的连接。

* 译注: [C10K 问题][C10k problem]

###  NGINX 工作方式

NGINX 使用一种为可用硬件资源优化的可预测得进程模型:

  * _master_ 进程执行诸如读取配置和绑定端口等权限操作, 然后创建少量的子进程(下面介绍的三种类型)。
  * _cache loader_ 进程在启动时把磁盘缓存载入内存, 然后退出。它被谨慎的调度所以资源需求很低。
  * _cache manager_ 进程周期性的运行并清理磁盘缓存条目, 使其保持在配置指定的大小。
  * _worker_ 进程负责其余工作, 包括处理网络连接, 磁盘内容读写, 和上游服务器通讯。

大多数情况下 NGINX 推荐配置为一个核芯一个 worker 进程， 这样可以最高效利用硬件资源。可以在配置文件的 [worker_processes](http://nginx.org/en/docs/ngx_core_module.html?#worker_processes) 指令中设置一个 **auto** 参数来启用。

```
worker_processes auto;
```

NGINX 启动后, 只有 worker 进程是忙碌的。 每个 worker 进程以非阻塞的方式处理多个连接, 减少上下文切换的次数。

每个 worker 进程是单线程且独立运行的， 拿到新的连接并进行处理。进程间可以使用共享内存来共用缓存数据，会话持久数据还有其他共享资源。

###  深入 NGINX Worker 进程

![HTTP State Machine in NGINX](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.39.48-PM.png)

NGINX worker 进程使用 NGINX 配置进行初始化, 并获取一组由 master 进程提供的监听监听套。

NGINX worker 进程首先等待监听套接字上的事件([accept_mutex][accept_mutex]和[kernel socket sharding][kernel socket sharding])。新接入的连接触发事件。连接分配到一个状态机，最常用的是 HTTP 状态机，但 NGINX 也为原生TCP流和一系列邮件协议(SMTP, IMAP 和 POP3)实现了状态机。

![NGINX upstream services](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.40.32-PM.png "Internet Requests")

状态机本质上是告诉 NGINX 如何处理请求的指令集。大部分 web 服务器也是像 NGINX 一样使用状态机来提供这样的功能，但内部实现不同。

* 译注: 通过设置 accept_mutex 以串行化的方式唤醒一个 worker, 避免惊群。设置 reuseport(就是上面提到的 kernel socket sharding 特性) 后每个 worker 持有一个socket由内核决定哪个 worker 获得连接。

###  状态机的调度

把状态机想像为国际象棋规则。每个 HTTP 事务都是一次国际象棋对局。棋盘的一边是 web 服务器，可以快速作出决定的象棋大师。另一边是远程客户端，通过相对慢速的网络访问网页或应用的浏览器。

然而，游戏规则可能非常复杂。例如 web 服务器可能还需要和第三方通信(代理到上游)或和认证服务器交互。服务器上的第三方模块甚至可以拓展游戏规则。

####  阻塞的状态机

回想前面对于进程和线程的描述，是操作系统可以在一个核芯上调度运行的一组指令集。大多数 web 服务器和 web 应用使用每个连接一个进程或每个连接一个线程的模型来下象棋。每个进程或线程都包含从头到尾进行下棋的指令。服务器运行过程中，耗费了大量的时间等待客户端采取进一步行动，即“阻塞”。

![NGINX listen sockets](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.40.52-PM.png "Blocking I/O")

  1. web 服务器进程在监听套接字上监听新来的连接(客户端触发开局)。
  2. 新的一局开始后，进程走了一步后会阻塞来等待客户端响应。
  3. 一旦对局结束， web 服务器进程还可能等待让客户端新开一局游戏(对应于 keepalive 连接)。如果连接关闭(客户端离开或发生超时), 进程又回到监听状态。

重点要记住每个活跃的 HTTP 连接(每次国际象棋对局)都要求一个专门的进程或线程(一个棋手)。这种架构可以简单方便地进行第三方模块拓展(新规则)。但是存在极大的不平衡：由文件描述符和少量内存表示的相对轻量级的 HTTP 连接对应于一个单独的非常重量级的操作系统对象线程或进程。这方便了编程却极大地浪费了资源。


####  NGINX 是真正的大师

你应该听说过车轮战吧？一个国际象棋大师同时和几十个对手下棋。

![Kiril Georgiev, chess grandmaster](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Kiril-Georgiev.gif "Kiril Georgiev")

这就是 NGINX worker 进程“下棋”的方式。每个 worker (记住,通常是每个核芯一个 worker) 都是一个可以同时进行上百场(事实上，成千上万)对局的棋手。

![NGINX non-blocking event-driven architecture](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.41.13-PM.png "Event-driven Architecture")

  1. worker 等待监听和连接的套接字上触发事件。
  2. worker 处理套接字上发生的事件：
      * 监听套接字上的事件意味着客户端开始了新的对局。worker 创建一个新的连接套接字。
      * 连接套接字上的事件意味着客户端走了一步。worker 适当的应对。

Worker 从不在网络流量上阻塞来等待它的“对手”(客户端)响应。当它走了一步后，worker 立即处理其他需要处理的对局或迎接新来的对手。

####  比阻塞式多进程的架构更快的原因

NGINX 可以很好地扩展，以支持每个工作进程成千上万的连接。每个新连接在 worker 进程中创建另一个文件描述符和消耗少量的内存。每个连接几乎没有额外的开销。NGINX进程可以保持在 CPU 中运行。上下文切换相对不频繁仅在进程没有工作需要完成时发生。

在阻塞式每进程一个连接的方式中，每个连接需要大量的额外资源和开销还有上下文切换(进程在CPU中交换)非常频繁。

进一步的解释可以查看这篇关于 NGINX 架构的[文章][architecture], 由 NGINX 的企业发展副总裁和联合创始人 Andrew Alexeev 所写。

加上适当的[系统调优][tuning-nginx], NGINX 可以扩展至每个 worker 进程处理数十万个并发HTTP连接并可以吸收流量尖峰（新对局的涌入），而毫不乱套。

###  NGINX 配置更新和升级

NGINX 这种使用少量 worker 进程的架构可以极其有效的更新配置文件和 NGINX 二进制执行文件本身.

![NGINX load new configuration](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.41.33-PM.png "Updating Configuration")

更新 NGINX 配置是容易、轻量和可靠的操作。一般是通过运行 `nginx -s reload` 命令，它会检查磁盘中的配置并给 master 进程发送 SIGHUP 信号。

当 master 进程接收 SIGHUP, 它做两件事情:

  1. 加载配置并 fork 一组新的 worker 进程。这些 worker 进程马上开始接收新连接和处理网络请求（使用新的配置）。
  2. 发送信号让旧的 worker 优雅退出。这些 worker 进程停止接收新连接。只要每个现有的 HTTP 请求完成， worker 进程干净地关闭连接(换句话说，就是没有活动的连接)。当旧 worker 进程所有连接完全关闭后便会退出。

重新加载配置的过程会造成 CPU 和内存使用率少量上升, 但和活跃连接加载资源相比这一般不易察觉。你可以每秒多次更新配置(很多 NGINX 用户确实这么做)。少数情况下，当很多代 NGINX worker 进程等待连接关闭时会出现问题，但即使是这样也会很快解决。

NGINX的二进制升级过程实现了高可用性，你可以随时升级，而不造成任何连接丢失，停机时间或服务中断。

![NGINX load binary with no downtime](https://cdn.wp.nginx.com/wp-content/uploads/2015/06/Screen-Shot-2015-06-08-at-12.41.51-PM.png "New Binary")

二进制升级过程和优雅地重新加载配置的方式类似。新的 master 进程和原来的 master 进程并行运行，共享监听的 socket。两个进程都是活动的，它们相应的 worker 进程处理流量。你可以给旧的 master 和它的 worker 进程发信号让它优雅退出。

更多关于整个过程的描述在[控制 NGINX][control]。

###  结论

[Inside NGINX][infographic] 信息图提供对 NGINX 如何运作的高级概述，不过这简单的说明背后是逾十年的革新和优化。这使得 NGINX 在各种硬件上提供最佳性能同时保持现代 web 应用程序所需的安全性和可靠性。

如果你希望了解更多关于 NGINX 优化，请查看这些资源:

* [Installing and Tuning NGINX for Performance](http://www.nginx.com/resources/webinars/installing-tuning-nginx/) (webinar; [slides](https://speakerdeck.com/nginx/nginx-installation-and-tuning) at Speaker Deck)
* [Tuning NGINX for Performance](http://www.nginx.com/blog/tuning-nginx/)
* [The Architecture of Open Source Applications – NGINX](http://www.aosabook.org/en/nginx.html)
* [Socket Sharding in NGINX Release 1.9.1](http://www.nginx.com/blog/socket-sharding-nginx-release-1-9-1/) (using the SO_REUSEPORT socket option)

[control]: http://nginx.org/en/docs/control.html
[tuning-nginx]: http://www.nginx.com/blog/tuning-nginx/
[architecture]: http://www.aosabook.org/en/nginx.html
[accept_mutex]: http://nginx.org/en/docs/ngx_core_module.html?#accept_mutex
[kernel socket sharding]: http://www.nginx.com/blog/socket-sharding-nginx-release-1-9-1/
[C10k problem]: https://en.wikipedia.org/wiki/C10k_problem
[infographic]: http://www.nginx.com/resources/library/infographic-inside-nginx/
