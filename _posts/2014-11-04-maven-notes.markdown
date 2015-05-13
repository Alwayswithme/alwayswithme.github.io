---
layout       :  post
title        :  "maven notes"
date         :  2014-11-04 14:43:11
categories   :  notes
---
## 安装Maven
{% highlight bash %}
~ $ yum install maven
~ $ mvn --version   #校验是否正确安装
# => Apache Maven 3.1.1 (NON-CANONICAL_2013-11-08_14-32_mockbuild; 2013-11-08 22:32:41+0800)
# => Maven home: /usr/share/maven
# => Java version: 1.7.0_71, vendor: Oracle Corporation
# => Java home: /usr/lib/jvm/java-1.7.0-openjdk-1.7.0.71-2.5.3.0.fc20.x86_64/jre
# => Default locale: en_US, platform encoding: UTF-8
# => OS name: "linux", version: "3.16.6-200.fc20.x86_64", arch: "amd64", family: "unix"
{% endhighlight %}

## 创建Maven Project
{% highlight bash %}
~/dev/java $ mvn archetype:generate \
    -DarchetypeGroupId=org.apache.maven.archetypes \
    -DgroupId=com.mycompany.app \                      #包名
    -DartifactId=my-app \                              #项目名
    -DinteractiveMode=false                            #交互模式

#将生成下列文件及目录
~/dev/java $ tree my-app/
# => my-app/
# => ├── pom.xml
# => └── src
# =>     ├── main
# =>     │   └── java
# =>     │       └── com
# =>     │           └── mycompany
# =>     │               └── app
# =>     │                   └── App.java
# =>     └── test
# =>         └── java
# =>             └── com
# =>                 └── mycompany
# =>                     └── app
# =>                         └── AppTest.java
# => 
# => 11 directories, 3 files
{% endhighlight %}

## 常用命令
{% highlight bash %}
~ $ mvn compile            #仅编译main目录
~ $ mvn test-compile       #编译main和test,不运行单元测试
~ $ mvn test               #进行单元测试
~ $ mvn package            #打包
~ $ mvn clean              #清理
{% endhighlight %}

## pom.xml 配置
{% highlight xml %}
<!-- 属性 在xml中通过 ${ } 获取-->
<properties>
  <myprop>tets</myprop>
</properties>

<!-- 指定 main/resources 外的资源 copy 到 build.path -->
<resources>
  <resource>
    <directory>src/main/java/</directory>
      <includes>
        <include>**/*Mapper.xml</include>
      </includes>
      <excludes>
        <exclude>**/*test*.java</exclude>
      </excludes>
 </resource>
</resources>

<!-- 各种插件 -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <version>3.3</version>
  <configuration>
    <source>1.7</source>
    <target>1.7</target>
    <encoding>UTF-8</encoding>
  </configuration>
</plugin>
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-jar-plugin</artifactId>
  <version>2.6</version>
  <configuration>
    <archive>
      <manifest>
        <addClasspath>true</addClasspath>
        <classpathPrefix>lib/</classpathPrefix>
        <mainClass>me.phx.flash.policy.FlashPolicyServer</mainClass>
      </manifest>
    </archive>
  </configuration>
</plugin>
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-dependency-plugin</artifactId>
  <version>2.10</version>
  <executions>
    <execution>
      <id>copy</id>
      <phase>package</phase>
      <goals><goal>copy-dependencies</goal></goals>
      <configuration>
        <outputDirectory>${project.build.directory}/lib</outputDirectory>
      </configuration>
    </execution>
  </executions>
</plugin>
{% endhighlight %}
