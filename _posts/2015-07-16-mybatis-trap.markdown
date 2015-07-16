---
layout       :  post
title        :  "mybatis trap"
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
