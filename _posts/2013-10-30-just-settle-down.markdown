---
layout: post
title:  "Just Settle Down"
date:   2013-10-30 02:43:00
categories: jekyll update
---
`github-pages` 和 `jekyll` 部署过程大致如下

{% highlight bash %}
~ $ sudo yum install ruby gcc ruby-devel

# gem 换淘宝源
~ $ gem sources --remove https://rubygems.org/
~ $ gem sources -a https://ruby.taobao.org

# ruby版本1.9以上
~ $ sudo gem install jekyll

# 在家新建一个website
~ $jekyll new alwayswithme

# 启动服务器
~ $ cd ~/alwayswithme;jekyll serve

# 地址栏输入0:4000应该可以看到生成页面

# 使用git pages前准备一个username.github.io的仓库
~ $ git init
~ $ git remote add origin git@github.com:Alwayswithme/alwayswithme.github.io.git
~ $ git add . && git commit -m 'initial commit'
{% endhighlight %}
