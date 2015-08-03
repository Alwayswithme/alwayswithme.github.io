---
layout       :  post
title        :  "Solr 索引 MySQL 数据库"
date         :  2015-08-03 23:14:59
categories   :  jekyll update
---
### 前言

MySQL 用到 `LIKE %keyword%` 时，索引不起作用，而且不好做高亮。
查询语句也会写的比较复杂。假设有以下table：

### Schema & Data

{% highlight sql %}
-- schema-mysql.sql
CREATE TABLE IF NOT EXISTS user (
  `user_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
  `name` VARCHAR(30),
  `email` VARCHAR(30),
  `company` VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS user_privacy (
  `user_id` INT PRIMARY KEY ,
  `hide_name` BOOLEAN DEFAULT FALSE ,
  `hide_email` BOOLEAN DEFAULT FALSE ,
  `hide_company` BOOLEAN DEFAULT FALSE
)

-- data-mysql.sql
INSERT INTO user (name, email, company) VALUES
  ('user1', 'user1@example.org', 'test-corp'),
  ('user2', 'user2@example.org', 'test-corp'),
  ('user3', 'user3@example.org', 'test-corp');

INSERT INTO user_privacy (user_id, hide_name, hide_email, hide_company) VALUES
  (1, FALSE , FALSE , TRUE ),
  (2, TRUE , FALSE , FALSE ),
  (3, TRUE , TRUE , TRUE );
{% endhighlight %}

希望仅检索没有隐藏的字段，检索出来的用户隐藏字段要加以过滤
于是有以下 SELECT 语句：
{% highlight sql %}
SELECT
  user_id,
  IF (hide_name, '---', name) AS name,
  IF (hide_email, '---', email) AS email,
  IF (hide_company, '---', company) AS company
FROM user JOIN user_privacy USING (user_id)
WHERE (hide_name = FALSE AND name LIKE '%user%')
  OR (hide_email = FALSE AND email LIKE '%user%')
  OR (hide_company = FALSE AND company LIKE '%user%')
{% endhighlight %}

### 配置

* solr-5.2.1/server/lib/ext/ 目录加入 `mysql-connector-java-5.1.35.jar`
* 命令行 standalone 模式启动 `bin/solr start`
* 创建 core `bin/solr create -c test`

### Solr 索引 MySQL 的数据
`solrconfig.xml` 添加 DataImportHandler 的库并设置 Handler， 注释 ManagedIndexSchemaFactory ， 启用 ClassicIndexSchemaFactory
{% highlight xml %}
<!-- solrconfig.xml  -->
  <lib dir="${solr.install.dir:../../../..}/dist/" regex="solr-dataimporthandler-.*\.jar" />

  <requestHandler name="/dataimport" class="solr.DataImportHandler">
    <lst name="defaults">
      <str name="config">db-data-config.xml</str>
    </lst>
  </requestHandler>

  <schemaFactory class="ClassicIndexSchemaFactory"/>
{% endhighlight %}

`db-data-config.xml` 配置 SQL 语句：
{% highlight xml %}
<!-- db-data-config.xml  -->
<dataConfig>
  <dataSource type="JdbcDataSource"
            driver="com.mysql.jdbc.Driver"
            url="jdbc:mysql://localhost:3306/spitter"
            user="root"
            password="root" /> 
  <document>
    <entity name="user" query="SELECT user_id,
                                 IF(hide_name, '---', name) AS name,
                                 IF(hide_email, '---', email) AS email,
                                 IF(hide_company, '---', company) AS company
                               FROM user LEFT JOIN user_privacy USING (user_id)">
        <field column="user_id" name="id" />
        <field column="name" name="name" />
        <field column="email" name="email" />
        <field column="company" name="company" />
    </entity>
  </document>
</dataConfig>
{% endhighlight %}
`managed-schema` 改名为 `schema.xml` 添加字段
{% highlight xml %}
<!-- schema.xml  -->
    <field name="name" type="string" indexed="true" stored="true" required="true"/>
    <field name="email" type="string" indexed="true" stored="true" required="true"/>
    <field name="company" type="string" indexed="true" stored="true" required="true"/>
{% endhighlight %}

### 导入数据

localhost:8983/solr/test/dataimport?command=full-import
