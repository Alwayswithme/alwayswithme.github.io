---
layout: post
title:  "Just Settle Down"
date:   2013-10-30 02:43:00
categories: jekyll update
---

错手删掉自己的wordpress博客,塞翁失马,终于下定决心迁移到jekyll.  
页面大部分都采用HTML5语义化标签,也用了部分CSS3  
没有过多测试,有游客发现bug麻烦告知一声,谢谢!

部署过程大致如下
{% highlight bash %}
$ yum install ruby gcc

# gem 换淘宝源
$ gem sources --remove https://rubygems.org/
$ gem sources -a http://ruby.taobao.org

# 在家新建一个website
$ cd; jekyll new alwayswithme

# 启动服务器
$ jekyll serve --watch

# 地址栏输入0:4000应该可以看到生成页面

# 使用git pages前准备一个username.github.io的仓库
$ git init
$ git remote add origin git@github.com:Alwayswithme/alwayswithme.github.io.git
$ git add . && git commit -m 'initial commit'
{% endhighlight %}
