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
