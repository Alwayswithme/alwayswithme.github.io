---
layout       :  post
title        :  "ArchLinux 搭建安卓开发环境"
date         :  2015-08-12 21:33:10
categories   :  jekyll update
---

Android-Studio 和相关 SDK 直接从包管理器 yaourt 下载，让系统中所有用户都能使用

### 准备

* 64位系统， Pacman 先开启 [multilib](https://wiki.archlinux.org/index.php/Multilib) 
需要用到相关的包
* 为了让 Android-Studio 字体美观， 安装 [infinality-bundle](https://wiki.archlinux.org/index.php/Infinality#Installation_2)
和打过 infinality 补丁的 jdk8-openjdk-infinality

### 配置

#### 安装 [Yaourt](https://wiki.archlinux.org/index.php/Yaourt)
用 yaourt 安装软件包时需要打包，开启 xz 的多线程压缩加快打包过程
开启方法: 编辑 `/etc/makepkg.conf` 修改其中一项

    # /etc/makepkg.conf

    [...]
    COMPRESSXZ=(xz -T 0 -c -z -)
    [...]

减少与 yaourt 的交互
{% highlight sh %}
# 复制配置文件
cp /etc/yaourtrc ~/.yaourtrc

# 编辑文件取消下列两项的注释并修改值
BUILD_NOCONFIRM=1
EDITFILES=0
{% endhighlight %}
#### 翻墙
aur 中部分包下载也需要翻墙， 使用 Shadowsocks 只需在终端通过修改环境变量让 yaourt 走代理

    export http_proxy=socks5://127.0.0.1:1080 https_proxy=socks5://127.0.0.1:1080

### 需要安装的包

    yaourt -S aur/android-bash-completion \
    aur/android-google-apis \
    aur/android-google-apis-x86 \
    aur/android-google-repository \
    aur/android-platform \
    aur/android-sdk \
    aur/android-sdk-build-tools \
    aur/android-sdk-platform-tools \
    aur/android-sources \
    aur/android-studio \
    aur/android-support \
    aur/android-support-repository

陷入漫长等待

### Android-Studio 初始启动

让 `/opt/android-sdk/` 对 sudoer 可写
{% highlight sh %}
chown -R :wheel /opt/android-sdk/
chmod -R g+w /opt/android-sdk/
{% endhighlight %}

打开 Android-Studio ， 初始启动， 选 custom 将 sdk 下载目录改为 /opt/android-sdk/， 再返回选择 standard ，一直 next 直到 finish. 
随便创建一个项目，还要下载 gradle ，再次陷入漫长等待。

### 模拟器硬件加速

安装 kvm 相关的包
{% highlight sh %}
sudo pacman -S qemu libvirt
{% endhighlight %}

给模拟器添加相关的选项 [see also](http://developer.android.com/tools/devices/emulator.html#vm-linux)
