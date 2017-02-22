---
layout       :  post
title        :  "Shadowsocks 翻墙"
date         :  2017-02-19 09:54:53
categories   :  jekyll update
---

记录在 VPS 搭建 shadowsocks 翻墙全过程


准备 VPS
----------

选择 [DigitalOcean](https://m.do.co/c/61165f60138e) 作为 VPS：
1. 稳定性不错
2. 有途径获得35刀免费试用7个月
3. kvm 虚拟化，支持调节内核参数

### 如何获得35美元？ ###
-   通过[推广链接](https://m.do.co/c/61165f60138e)注册
-   绑定信用卡或用paypal激活账户,获得10刀
-   注册[Codeanywhere](https://codeanywhere.com/signup)帐号
-   注册好后依次点击`File` -> `New Connection` -> `Digital Ocean`, 点击`Get Coupon`
-   获得优惠后在DigitalOcean的Billing界面填入, 再获得25刀


安装 [shadowsocks-libev](https://github.com/shadowsocks/shadowsocks-libev#installation)
-------------

```bash
~ # dnf copr enable librehat/shadowsocks
~ # dnf update
~ # dnf install shadowsocks-libev
```

编辑服务器端配置文件 `/etc/shadowsocks-libev/config.json`
```json
{
    "server":"0.0.0.0",
    "server_port":10718,
    "local_port":1080,
    "password":"passwd",
    "timeout":800,
    "method":"chacha20",
    "fast_open":true,     // 需要内核 3.7+
    "mode": "tcp_and_udp"
}
```

```bash
systemctl enable shadowsocks-libev.service   # 开机自启动
systemctl start shadowsocks-libev.service    # 运行ss-server
```

修改内核参数
--------------
编辑`/etc/sysctl.conf`
```
# max open files
fs.file-max = 51200
# max read buffer
net.core.rmem_max = 67108864
# max write buffer
net.core.wmem_max = 67108864
# default read buffer
net.core.rmem_default = 65536
# default write buffer
net.core.wmem_default = 65536
# max processor input queue
net.core.netdev_max_backlog = 4096
# max backlog
net.core.somaxconn = 4096

# resist SYN flood attacks
net.ipv4.tcp_syncookies = 1
# reuse timewait sockets when safe
net.ipv4.tcp_tw_reuse = 1
# turn off fast timewait sockets recycling
net.ipv4.tcp_tw_recycle = 0
# short FIN timeout
net.ipv4.tcp_fin_timeout = 30
# short keepalive time
net.ipv4.tcp_keepalive_time = 1200
# outbound port range
net.ipv4.ip_local_port_range = 10000 65000
# max SYN backlog
net.ipv4.tcp_max_syn_backlog = 4096
# max timewait sockets held by system simultaneously
net.ipv4.tcp_max_tw_buckets = 5000
# turn on TCP Fast Open on both client and server side
net.ipv4.tcp_fastopen = 3
# TCP receive buffer
net.ipv4.tcp_rmem = 4096 87380 67108864
# TCP write buffer
net.ipv4.tcp_wmem = 4096 65536 67108864
# turn on path MTU discovery
net.ipv4.tcp_mtu_probing = 1

# require linux kernel 4.9
net.core.default_qdisc=fq
# for high-latency network
net.ipv4.tcp_congestion_control =bbr

# for strongswan vpn
net.ipv4.ip_forward = 1
```

然后执行
```bash
sysctl -p
```
