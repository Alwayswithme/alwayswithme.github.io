---
layout: post
title: "Expression Trees"
date: 2013-11-10 13:26:54
categories: jekyll update
---
构建一颗表达式树, 本质仍是一颗二叉树,可在叶子节点存放操作数, 双亲结点放运算符,一棵子树又可以看作另一叶子节点。
以类似于霍夫曼编码的方式将栈中的结点组织起来，为了简化操作，以空格分割的字符串作为一个Token，首先将中缀表达式转换为后缀表达式。

* 实现思路, 数字直接输出, 碰到右圆括号, 不断弹栈并直到找到匹配的左圆括号.
* 看到其他运算符, 弹栈至找到低优先级的运算符, 该过程要保留左圆括号.

{% highlight java %}
import java.util.HashMap;

public class PostfixConversion {
  public static final Integer BUF_SIZE = 100;
  /* 低优先级运算符 */
  public static final Integer LOW_PRI_OP = 1;
  /* 高优先级运算符 */
  public static final Integer HIGH_PRI_OP = 2;
  /* 圆括号 */
  public static final Integer PAREN = 3;

  /* 运算符对照表 */
  public static HashMap<String, Integer> opTable = new HashMap<>();
  static {
    opTable.put("+", LOW_PRI_OP);
    opTable.put("-", LOW_PRI_OP);
    opTable.put("*", HIGH_PRI_OP);
    opTable.put("/", HIGH_PRI_OP);
    opTable.put("(", PAREN);
    opTable.put(")", PAREN);
  }
  /* 泛型栈的简单实现 */
  private static class Stack<T> {
    int top = 0;
    T[] buf;
    Stack() {
      buf = (T[])new Object[BUF_SIZE];
    }
    public void push(T item) {
      if (item == null)
        return;
      buf[top++] = item;
    }
    public T pop() {
      return (T)((top > 0) ? buf[--top] : null);
    }
  }
  /**
   * 将中缀表达式转换为后缀表达式
   * @param infix 以空格分割的中缀表达式
   * @return 逆波兰表达式
   */
  static String convert(String infix) {
    String[] input = infix.split(" ");
    StringBuilder output = new StringBuilder();
    String temp;
    Stack<String> opStack = new Stack<>(); // 运算符栈
    for (String str: input)
      if ( opTable.containsKey(str) ) { // 如果是运算符,进行处理
        Integer priority = opTable.get(str); // 获取当前运算符优先优先级
        if (priority == PAREN && ")".equals(str)) {
          // 输出运算符栈中与对应圆括号之间所有运算符
          while (!"(".equals(temp = opStack.pop()))
            output.append(temp).append(" ");
        } else {
          // 输出优先级比当前高或相等的运算符,并把当前运算符压入栈中
          for (temp = opStack.pop(); temp != null &&
              opTable.get(temp) != PAREN &&
              opTable.get(temp) >= priority; temp = opStack.pop())
            output.append(temp).append(" ");
          opStack.push(temp);
          opStack.push(str);
        }
      } else    // 不是运算符直接输出
        output.append(str).append(" ");

    // 取出运算符栈中所有运算符
    while (( temp = opStack.pop()) != null)
      output.append(temp).append(" ");
    return output.toString();
  }
  /* TODO 
  private static class Node<T> {}
  static Node<String> expTree(String postfix) {}
  */
}
{% endhighlight %}

* 有了后缀表达式,剩下只要构建树就可以了,继续沿用上面的类
{% highlight java %}
/* 简单的二叉树实现 */
private static class <T> {
  T element;
  Node<T> left;
  Node<T> right;
  Node(T theElement) {
    this(theElement, null, null);
  }
  Node(T theElement, Node<T> lt, Node<T> rt) {
    element = theElement;
    left = lt;
    right = rt;
  }
}
/**
 * 将后缀表达式转换为表达式树
 * @param postfix 要转换的后缀表达式
 */
static Node<String> expTree(String postfix) {
  String[] token = postfix.split(" ");
  Stack<Node<String>> nodeStack = new Stack<>(); //树的结点栈
  for ( String str: token) {
    if (opTable.containsKey(str)) {
      Node<String> rightNode = nodeStack.pop();
      Node<String> leftNode = nodeStack.pop();
      Node<String> tmp = new Node<>(str, leftNode, rightNode);
      nodeStack.push(tmp);
    } else
      nodeStack.push(new Node<String>(str));
  }
  return nodeStack.pop();
}
private static <T> void print(Node<T> t, int indent) {
  if (t != null) {
    print(t.right, indent + 1);
    for (int i= 0; i < indent; i++)
      System.out.print("   ");
    System.out.println(t.element);
    print(t.left, indent + 1);
  }
}
{% endhighlight %}

{% highlight java %}
public static void main(String[] args) {
  System.out.println("=== inorder: ===");
  String infix = "( a + ( b * c ) ) + ( ( ( d * e ) - f ) * g )";
  System.out.println(infix+"\n=== postoreder: ===");
  String postfix = convert(infix);
  System.out.println(postfix+"\n=== 表达式树: ===");
  Node<String> expTree = expTree(postfix);
  print(expTree, 0);
}
/*
 * output:
 * =>  === inorder: ===
 * =>  ( a + ( b * c ) ) + ( ( ( d * e ) - f ) * g )
 * =>  === postoreder: ===
 * =>  a b c * + d e * f - g * + 
 * =>  === 表达式树: ===
 * =>        g
 * =>     *
 * =>           f
 * =>        -
 * =>              e
 * =>           *
 * =>              d
 * =>  +
 * =>           c
 * =>        *
 * =>           b
 * =>     +
 * =>        a
 * =>  
 */
{% endhighlight %}
