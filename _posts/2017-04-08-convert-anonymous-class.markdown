---
layout       :  post
title        :  "改造匿名内部类"
date         :  2017-04-08 13:32:54
categories   :  java
---

最近接手的项目中，看到一个分页对象用了一种奇怪的实现方式。一个 `Paging` 接口定义了获取分页大小和页码的方法，后续的查询竟然每次都通过匿名内部类去实现这个接口，然后作为查询参数。

示例代码
----------
```java
public interface Paging {
    int getSize();
    int getCurrentPage();
}

public class Test {
    public static void main(String[] args) {
        Paging paging = new Paging() {
            @Override
            public int getSize() {
                return 10;
            }

            @Override
            public int getCurrentPage() {
                return args.length;
            }
        };

        // 使用 paging 计算limit offset做分页查询
    }
}
```
对这段代码不爽的地方

* 冗长，可读性和维护性差
* 编译出来会多几个形如 `xxx$1.class` 文件

每个匿名内部类都要加载、链接、初始化虽然对现代JVM影响不大，但加载类过多还是有可能导致JDK7及以前版本的 `PernGem OOM` 和JDK8 `Metaspace OOM`。

改造方式
----------
本质就是一个实现了 `Paging` 接口 data class 就能解决，IDEA 也提供相应的重构方法。先转为内部类，在抽到其他地方统一修改。

* 右键匿名类 -> Refactor -> Convert Anonymous to Inner
![匿名类重构]({{ "/images/Screenshot_2017-04-08_14-26-39.png" | prepend: site.baseurl }})
* 右键内部类 -> Refactor -> Move
![内部类重构]({{ "/images/Screenshot_2017-04-08_14-27-17.png" | prepend: site.baseurl }})

最终类文件变成
```java
class MyPaging implements Paging {
    private final String[] args;

    public MyPaging(String[] args) {
        this.args = args;
    }

    @Override
    public int getSize() {
        return 10;
    }

    @Override
    public int getCurrentPage() {
        return args.length;
    }
}
```
感觉还是比较呆，再稍加修改，主要参考 MyBatis 的 RowBounds。除此之外，Spring Data 的 Pageable 及其实现类也是很优雅的分页实现。
```java
public class MyPaging implements Paging {

    public static final int DEFAULT_SIZE = 10;
    public static final int DEFAULT_PAGE = 1;
    public static final MyPaging DEFAULT = new MyPaging(DEFAULT_SIZE, DEFAULT_PAGE);
    
    private int size;
    private int currentPage;
    
    public static MyPaging defaultPaging() {
        return DEFAULT;
    }

    public MyPaging(int s, int p) {
        this.size = s;
        this.currentPage = p;
    }

    @Override
    public int getSize() {
        return this.size;
    }

    @Override
    public int getCurrentPage() {
        return this.currentPage;
    }
}
```
现在通过两个参数创建`MyPaging`对象就可以了

其他思考
----------
匿名内部类主要是方便，但不利于复用，而且导致很多class文件。像Runable，Comparator这样只有一个抽象方法要实现的接口(由此也多了一个`@FunctionalInterface`的注解)， Java 8 的lambda表达式感觉更优雅。

```java
public class Anonymous {
    public static void main(String[] args) {
        Comparator<String> cmp1 = new Comparator<String>() {
            @Override
            public int compare(String o1, String o2) {
                return 1;
            }
        };

        Comparator<String> cmp2 = new Comparator<String>() {
            @Override
            public int compare(String o1, String o2) {
                return 1;
            }
        };
    }
}
```

像上面这段代码最终会生成三个类文件，哪怕两个匿名内部类完全一致。
![匿名类生成三个class]({{ "/images/Screenshot_2017-04-08_15-46-41.png" | prepend: site.baseurl }})
这时可以改为Lambda表达式，使代码更简洁优雅。
![lambda还是一个class]({{ "/images/Screenshot_2017-04-08_15-45-54.png" | prepend: site.baseurl }})

两张图对比，还可以得出的结论

* Lambda 表达式不是匿名类的语法糖，有自己的实现方式
* 匿名类最终编译的文件比 Lambda 大，674 B + 812 B + 812 B > 1.4 KB

最后补充
----------
回到主题，项目里各处用到这个 Paging 都是这种匿名内部类的写法，也不知道生产环境存在多少class文件。按照我上面的对比代码，把 Comparator 增加至10个，每个`xxx$1..10.class`都占812 B，难怪搭建环境时 Tomcat 的老是出现 `PernGem OOM`，但也和大量 JSP 和 Servlet 有关。

最近看了很多JD，很有感觉的一段话是：
>我们希望你对互联网或J2EE应用开发的最新潮流有关注，喜欢去看及尝试最新的技术，追求编写优雅的代码，从技术趋势和思路上能影响技术团队

也终于理解为什么《The Pragmatic Programmer》和《Refactoring: Improving the Design of Existing Code》会多次强调 [DRY 原则](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)的重要性
