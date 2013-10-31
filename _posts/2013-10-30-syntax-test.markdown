---
layout: post
title:  "Syntax test"
date:   2013-10-30 13:31:00
categories: jekyll update
---

### 语法高亮测试 ###

选用了我最喜欢的Monokai配色  

随便写几道找工作被问到的笔试题  

- Python快排简便写法,以后笔试就用它
{% highlight python %}
def quick(L):
  if not L: return []
  return quick([x for x in L[1:] if x < L[0]]) + L[0:1] + \
    quick([x for x in L[1:] if x x >= L[0]])
{% endhighlight %}

  
  

- 给定一个数组,求其子序列最大乘积的部分,给出起始索引和终止索引
{% highlight java %}
import java.util.Arrays;
import java.util.List;

public class MaxSubsequence {
  public static void main(String[] args) {
    Integer[] arr = {1, -2, 3, 0, 5, 10, -4, 7, 4, 6, -5};
    maxSubMultiply(arr);
  }
  /**
   * Linear-time maximum contiguous subsequence sum algorithm
   */
  static void maxSubMultiply(Integer[] arr) {
    int maxSum, currSum, start, end, current;
    maxSum = start = end = current = 0;
    currSum = 1;
    for (int i = 0; len = arr.length; i < len; i++) {
      currSum *= arr[i];
      maxSum = thisSum;
      start = current;
      end = i;
    } else if (currSum <= 0) {
      thisSum = 1;
      current = i + 1;
    }
  }
  List<Integer> result = Arrays.asList(arr).subList(start, end + 1);
  System.out.println("Max subsequence is: " + result +
      "\nStart index: " + start + "\nEnd index: " + end);
}
// Output:
//=> Max subsequence is: [7, 4, 6]
//=> Start index: 7
//=> End index: 9
{% endhighlight %}

- 删除多余的空白
{% highlight java %}
import static java.lang.System.out;

public class Trim {
  public static void main(String[] args) {
    String temp = "    Jekyll     is    the     best  "
      + "static  site generator   ever!    ";
    out.println(temp.replaceAll("^ *", "").replaceAll(" +", " ").replaceAll(" $",""));
  }
}
/*
 *  Output:
 *  => Jekyll is the best static site generator ever!
 */
{% endhighlight %}

- 魔幻方阵
{% highlight java %}
public class MagicMatrix {
  public static final int N = 5;
  public static void main(String[] args) {
    int[] matrix = new int[N*N];  //一维数组模拟二维坐标系
    int y, x, number;
    y = 0;
    x = N>>1;
    matrix[y*N + x] = 1;    //第一个数字放中间
    for (number = 2; number <= matrix.length; number++) {
      if (matrix[(((y-1+N)%N)*N + ((x+1)%N))] == 0) {
        //右上角位置没有放入数字
        y = (y-1+N)%N;
        x = (x+1)%N;
      } else
        //右上角已有数字则填充下面
        y = (y+1)%N;
      matrix[y*N + x] = number;
    }
    printMatrix(matrix);
  }  
  static void printMatrix(int[] arr) {
    for (int i = 0, len = arr.length; i < len; i++) {
      System.out.printf("%-4d  %s", arr[i], (i % N == N-1) ? "\n" : "");
    }
  }
}
{% endhighlight %}
