---
layout       :  post
title        :  Regex tricks
date         :  2014-03-02 02:36:52
categories   :  jekyll update
---
##判断素数
{% highlight java %}
boolean isPrime(int n) {
  return !new String(new char[n]).matches("^.?$|^(..+?)\1+$");
}
/*
 * 把数字转换为与其大小一样的字符串
 * 第一部分：0或1能被匹配而matches返回真，取反，结果是合数。
 * 第二部分：非贪婪模式枚举除数大小，再利用至少出现一次捕获组 
 * 大致可以表示n由相同的序列由多于2次的匹配合成，即可以整除。
 * 如不能整除，匹配不成功matches返回假，取反，结果是素数。
 */
{% endhighlight %}


##删除指定元素
{% highlight javascript %}
//清楚标签
str.replace(/(<[/]?[^>]+>)/g, '');

//清除多行注释
str.replace(/(/*([^*]|(*+[^*/]))**+/)/gm, '');
{% endhighlight %}
