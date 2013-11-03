---
layout: post
title: "编程艺术第一章"
date: 2013-11-01 22:58:03
categories: jekyll update
---
[程序员编程艺术:第一章][chap-1]  
[chap-1]: http://blog.csdn.net/v_JULY_v/article/details/6322882
### 左旋转字符串

* 暴力移位法
{% highlight c %}
void leftshiftone(char *s, int n) {
  char t = s[0];
  for (int i = 1; i < n; ++i)
    s[i - 1] = s[i];
  s[n - 1] = t;
}
void leftShift(chat *s, int n, int m) {
  while (m--) {
    leftshiftone(s, n);
  }
}
{% endhighlight %}

* 指针翻转法  
`abc`defghi  
def`abc`ghi  
defghi`abc`  
{% highlight java %}
void rotate(char[] str, int m) {
  int n = str.length;
  if (n == 0 || m <= 0 || m % n <= 0)
    return;
  // 字符数组索引
  int idx1 = 0, idx2 = m;
  // k为可以安全右移的次数
  int k = (n - m) - n % m;
  while(k-- != 0) {
    swap(str[idx1++],str[idx2++]);
  }

  // 处理尾部,r为尾部左移次数
  int r = n - idx2;
  while(r-- != 0) {
    int i = idx2;
    while(i > idx1) {
      swap(str[i],str[i-1]);
      i--;
    }
    idx2++;
    idx1++;
  }
}
{% endhighlight %}

* 递归转换法
{% highlight java %}
void rotate(char[] str, int n, int m, int head, int tail, boolean flag) {
  // 递归结束条件
  if (head == tail || m <= 0)
    return;
  if (flag) {
    // 右移
    int p1 = head;
    int p2 = head + m;
    int k = (n - m) - n%m;
    for (int i = 0; i < k; i++, p1++, p2++)
      swap(str[p1], str[p2]);
    rotate(str, n - k, n % m, p1, tail, false);
  }else {
    // 左移
    int p1 = tail;
    int p2 = tail - m;

    int k = (n - m) - n % m;
    for (int i = 0; i < k; i++, p1--, p2--)
      swap(str[p1], str[p2]);
    rotate(str, n - k, n % m, head, p1, true);
  }
}
{% endhighlight %}
