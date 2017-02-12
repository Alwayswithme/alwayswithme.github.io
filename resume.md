---
layout: page
title: Resume
permalink: /resume/
---

叶锦昌
===============

手机：18503085112  
Email：<phx13ye@gmail.com>  
QQ/微信号：284718971  

个人信息
---------------

*   男/1991
*   工作年限：3年
*   本科/华南农业大学/生物技术专业 （ 2010年9月 ~ 2014年6月 ）
*   技术博客： [alwayswithme.github.io][博客]
*   GitHub： [github.com/Alwayswithme][GitHub]


工作经历
---------------

*   **深圳市傲冠软件股份有限公司**

    *开发工程师*， 2014年7月 ~ 至今，参与三个项目的研发和改进

    -   行云管家

        研究云计算厂商的管理界面及其开放API。基于 MongoDB, 设计开发了比价器和日志审计后台模块。发现项目中存在大量权限检查、日志记录、事务提交等重复冗余的代码，通过利用 Spring AOP 的特性将其消除。使用 Spring Data JPA、Shiro 搭建后台管理系统供内部使用。对接主流应用开放平台的登陆、微信扫码支付和支付宝即时到账等接口。

    -   行云服务•易代维

        分析产品所针对目标用户的需求，进行数据库设计，主导项目组使用 MyBatis 框架进行持久层开发。负责升级网站架构，完成全站 HTTPS 化，同时部署 Nginx 启用 HTTP/2 支持和将静态资源 CDN 加速，改善网站访问时延。使用 Java 7 NIO 开发文件传输模块，参与前端 ReactJs 组件的编写，以 JSON 作为数据交换格式，优化后台 AJAX 和 WebSocket 接口的传输速度。

    -   行云服务•云运维

        用到 SpringMVC 设计 RESTful API，并完善相关缺失文档。参与优化 MySQL 数据库，通过减少 JDBC 与数据库交互，改进 SQL 慢查询语句，针对全表扫描过多的表添加所需索引等手段，减轻服务器数据库压力和提高响应速度。还参与了涉及网络编程的行云网关模块，用 Netty 实现协议编解码，心跳与超时处理，加密压缩等功能。完成此项目的微信公众号中一部分后台功能的开发。


开源经验
---------------

*   提交的补丁和Bug

    -   [```Pull Request```][GitHub Pull Request] : 给 Netty 提交两次Pull Request， 给 java-design-patterns 提交单例模式的一种实现
    -   [```Issue```][GitHub Issue] : 发现 MyBatis 一个 Bug
    -   如出现404，请登陆GitHub

*   技术文章

    -   参与翻译文章《[X分钟速成Scala][scala-cn]》
    -   参与翻译文章《[X分钟速成Bash][bash-cn]》


技能清单
---------------

*   编程语言：Java/JavaScript/Bash/Python

*   Web开发：JSP/HTML/CSS

*   后端框架：Spring/Spring Boot/MyBatis/Guava/Netty

*   开发工具：Vim/IntelliJ IDEA/Nginx/Webpack

*   数据库  ：MySQL/MongoDB/SQLite

*   持续集成：Git/Npm/Maven/Jenkins

*   操作系统：Linux（ArchLinux 开发环境，搭建部署自己的 VPS 翻墙）

*   英语：通过CET-6，能流畅阅读英语技术文档


致谢
---------------

*   感谢您花时间阅读我的简历，期待能有机会和您共事


[博客]: https://alwayswithme.github.io
[GitHub]: https://github.com/Alwayswithme
[GitHub Pull Request]: https://github.com/pulls?q=is%3Apr+author%3AAlwayswithme+is%3Aclosed
[GitHub Issue]: https://github.com/issues?q=is%3Aissue+author%3AAlwayswithme+is%3Aclosed
[scala-cn]: http://learnxinyminutes.com/docs/zh-cn/scala-cn/
[bash-cn]: http://learnxinyminutes.com/docs/zh-cn/bash-cn/
