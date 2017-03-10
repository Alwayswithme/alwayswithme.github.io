---
layout       :  post
title        :  "使用Optional"
date         :  2017-03-10 21:26:42
categories   :  jekyll update
---

Java 8 引入了一个新的类`java.util.Optinal`来处理`null`引用，熟悉 Guava 的人应该对这个不陌生， Guava 的[文档](https://github.com/google/guava/wiki/UsingAndAvoidingNullExplained)开篇就是介绍这个东西。  
Guava 的 `Optional` 作用有限，一般用来作为方法的返回值如`Optional<T>`，表示可能缺失T，迫使调用者做对应处理。但 Java 的 `Optional` 可以配合方法引用和函数接口做更多的事情。类似还有 Guava 的 `Joiner` 和 Java 8 的 `StringJoiner`。  

`Optional` 结构比较简单，可以看作成员变量`value`的容器。
```java
public final class Optional<T> {
    /**
     * Common instance for {@code empty()}.
     */
    private static final Optional<?> EMPTY = new Optional<>();

    /**
     * If non-null, the value; if null, indicates no value is present
     */
    private final T value;

    // ...省略其他代码
}
```

构造方法
----------
`Optional` 的构造方法私有，通过三个静态工厂方法构造。
```java
Optional<String> empty = Optional.empty();  // 没有值的Optinal，返回静态变量EMPTY
Optional<String> present = Optional.of("str"); // 包含非空值的Optional

String maybeNullStr = null;
Optional<String> absent = Optional.ofNullable(maybeNullStr); // 内部会判断，如果为空返回empty，不为空返回包含值的Optinal
```

orElse, orElseGet
---------
如果值不存在，返回默认值。参数需要提供一个默认值，其中orElse直接提供，orElseGet则通过函数接口提供。
```java
String arg = null;
System.out.println(arg == null ? "default value" : arg);

Optional<String> argOpt = Optional.ofNullable(arg);
System.out.println(argOpt.orElse("default value"));
System.out.println(argOpt.orElseGet(() -> "default value"));
```

orElseThrow
------------
针对值不存在，抛出异常的情况，可以通过orElseThrow方便地做到。
```java
if (arg == null) {
    throw new IllegalArgumentException();
}

// 方法引用不能传参
argOpt.orElseThrow(IllegalArgumentException::new);
// 如果需要message，可以用 lambda 表达式
argOpt.orElseThrow(() -> new IllegalArgumentException("must not null"));
```

isPresent, ifPresent
-----------
前者判断Optinal的值是否存在，然后通过get取出。后者提供一个函数，值存在则将其消费。
```java
Optional<String> value = Optional.of("value");
if (value.isPresent()) {
    value.get();
}

value.ifPresent(System.out::println);
```

map, flatMap
-------------
map要提供一个转换函数，转换后再通过`Optional.ofNullable()`返回
```java
public<U> Optional<U> map(Function<? super T, ? extends U> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent())
        return empty();
    else {
        return Optional.ofNullable(mapper.apply(value));
    }
}
```
flatMap与map类似，但转换函数的返回值必须为`Optional`，转换后不会再包装`Optional`以避免生成多重`Optional`。
```java
public<U> Optional<U> flatMap(Function<? super T, Optional<U>> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent())
        return empty();
    else {
        return Objects.requireNonNull(mapper.apply(value));
    }
}
```

注意事项
-----------
声明为Optional的字段或返回值不可为null，缺失值要用`Optional.empty()`代替，缺失值要用`Optional.empty()`代替，缺失值要用`Optional.empty()`代替，不然还是会导致`NullPointerException`。
只要Optional不为null，它的API就可以安全的调用。类似于[Null Object](https://en.wikipedia.org/wiki/Null_Object_pattern)的设计模式。
```java
Optional<String> optional = null;
optional.isPresent();   // NPE
```

See Also
----------
*   [Java 8 Optional - Avoid Null and NullPointerException Altogether - and Keep It Pretty](https://dzone.com/articles/java-8-optional-avoid-null-and)
*   [Tired of Null Pointer Exceptions? Consider Using Java SE 8's Optional!](http://www.oracle.com/technetwork/articles/java/java8-optional-2175753.html)
