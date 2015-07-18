---
layout       :  post
title        :  "MyBatis的坑"
date         :  2015-07-16 22:33:14
categories   :  jekyll update
---

记录使用mybatis遇到的一些坑。

## 无法默认使用EnumOrdinalTypeHandler

缺省情况下，Mybatis使用EnumTypeHandler处理枚举类型。
因为源码中对各种类型是这样找其typeHandler的，[org/apache/ibatis/type/TypeHandlerRegistry.java:178](https://github.com/mybatis/mybatis-3/blob/master/src/main/java/org/apache/ibatis/type/TypeHandlerRegistry.java#L178)
{% highlight java %}
if (handler == null && type != null && type instanceof Class && Enum.class.isAssignableFrom((Class<?>) type)) {
    handler = new EnumTypeHandler((Class<?>) type);
}
{% endhighlight %}

数量少时可以在mybatis配置文件或xmlmapper直接指定：
{% highlight xml %}
<!-- mybatis-config.xml -->
<typeHandlers>
  <typeHandler handler="org.apache.ibatis.type.EnumOrdinalTypeHandler" javaType="java.math.RoundingMode"/>
</typeHandlers>

<!-- UserMapper.xml -->
<result column="roundingMode" property="roundingMode" typeHandler="org.apache.ibatis.type.EnumOrdinalTypeHandler"/>
{% endhighlight %}

数量多时如果通过java-config配置可以扫描出这些枚举类，遍历注册，[代码](https://github.com/Alwayswithme/spitter/blob/master/src/main/java/me/phx/config/MybatisConfig.java#L44)

## 二级缓存Evict难以控制

## XML和Annotation 混用时仅声明Cache的地方开启缓存

## 慎用@Options
MyBatis 缓存默认行为是使用`select`语句时使用缓存，其他则清空:
{% highlight xml %}
<select ... flushCache="false" useCache="true"/>
<insert ... flushCache="true"/>
<update ... flushCache="true"/>
<delete ... flushCache="true"/>
{% endhighlight %}

但用Annotation有一点例外，就是 `@Insert` 和 `Options` 注解一起使用时，
要明确指定是否flushCache，不然会导致缓存不清空。具体可看@Options源码：
{% highlight java %}
public @interface Options {
  boolean flushCache() default false;
}
{% endhighlight %}

