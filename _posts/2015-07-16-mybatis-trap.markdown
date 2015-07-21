---
layout       :  post
title        :  "MyBatis的坑"
date         :  2015-07-16 22:33:14
categories   :  jekyll update
---

记录使用mybatis遇到的一些坑。

## 无法默认使用EnumOrdinalTypeHandler

缺省情况下，Mybatis使用EnumTypeHandler处理枚举类型。
因为源码中对各种类型是这样找其typeHandler的，
[org/apache/ibatis/type/TypeHandlerRegistry.java:178](https://github.com/mybatis/mybatis-3/blob/master/src/main/java/org/apache/ibatis/type/TypeHandlerRegistry.java#L178)
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

数量多时，如果通过java-config配置则可以扫描出这些枚举类，遍历注册，具体参见[代码]
(https://github.com/Alwayswithme/spitter/blob/master/src/main/java/me/phx/config/MybatisConfig.java#L44)

## 二级缓存Evict难以控制

二级缓存问题，它是基于每个mapper的命名空间，假设有员工，公司。
员工mapper中某一个select根据employee_id查询查员工，根据company_id嵌套查询其公司
这个select被缓存后，
然后在公司mapper中CUD一番，怎么让员工mapper中那个select清空缓存？

有人为此制作了插件[mybatis-enhanced-cache](https://github.com/LuanLouis/mybatis-enhanced-cache).  
另外可以考虑Spring Cache Abstraction, 基于Annotation, 有多种实现可以选择 *EhCache*, *Guava* 等。

## XML和Annotation 混用时仅声明Cache的地方开启缓存

混用XML和Annotation 应该注意，只可以选择在XML写`<cache/>` 或 Mapper 接口使用 `@CacheNamespace`， 
但是这会导致只有XML上语句有缓存或Mapper接口上的语句有缓存， 取决于你在何处声明。
因此需要尽量避免混用的情况， 具体可以看我提的[issue](https://github.com/mybatis/spring/issues/62)

## 慎用@Options

MyBatis 缓存默认行为是使用`select`语句时使用缓存，其他则清空:
{% highlight xml %}
<select ... flushCache="false" useCache="true"/>
<insert ... flushCache="true"/>
<update ... flushCache="true"/>
<delete ... flushCache="true"/>
{% endhighlight %}

但用Annotation有一点例外，就是 `@Insert` 和 `@Options` 注解一起使用时，
要明确指定是否flushCache，不然会导致缓存不清空。具体可看`@Options`源码：
{% highlight java %}
public @interface Options {
  boolean flushCache() default false;
}
{% endhighlight %}

