---
layout       :  post
title        :  Learning Scala - 1
date         :  2013-11-16 15:06:35
categories   :  jekyll update
---
在[COURSERA](http://class.coursera.org/progfun-003/class/index)跟设计者学习Scala

### 编码风格

* 避免使用`isInstanceOf`或者`asInstanceOf`进行类型转换
* 使用两个空格进行缩进
* 不需要使用分号
* 避免使用`return`


### 函数式编程

* 不可变性
* 利于模块化
* 函数是一等公民,可以作为变量,参数等
* 适合并行多核环境和云计算


### Call-by-name & Call-by-value

* substitution model
* 只要保证是纯函数并有中止条件,两种调用方式结果一致
* Call-by-name 函数体中没有用到的参数可以不计算
* Call-by-value 只对参数计算一次

{% highlight scala %}
def loop: Int = loop

def first(x: Int, y: Int) = x

// Under CBN, get 1
first(1, loop)

// Under CBV, infinite loop
first(1, loop)

// Scala normally uses CBV, But if the type of a function
// parameter starts with => it uses CBN
def constOne(x: Int, y: => Int) = 1

constOne(1+2, loop) // get 1
constOne(loop, 1+2) // infinite loop
{% endhighlight %}


### 代码块与作用域

* avoid "name-space pollution"
{% highlight scala %}
def abs(x: Double) = if (x < 0) -x else x

def sqrtIter(guess: Double, x: Double): Double =
  if (isGoodEnough(guess, x)) guess
  else sqrtIter(improve(guess, x), x)

def isGoodEnough(guess: Double, x: Double) =
  abs(guess * guess - x) / x < 0.001

def improve(guess: Double, x: Double) =
  (guess + x / guess) / 2

def sqrt(x: Double) = sqrtIter(1.0, x)

// sqrtIter, isGoodEnough, improve只是sqrt的实现,无需暴露给用户
// 利用代码块和作用域重构

def sqrt(x: Double) = {

  def sqrtIter(guess: Double): Double =
    if (isGoodEnough(guess)) guess
    else sqrtIter(improve(guess))

  def isGoodEnough(guess: Double) =
    abs(guess * guess - x) / x < 0.001

  def improve(guess: Double) =
    (guess + x / guess) / 2

  sqrtIter(1.0)
}
// 清理了重复的x,使得代码更加简洁
{% endhighlight %}

### 尾递归
函数调用自身是最后一步操作,栈可以重用避免溢出

* __Base cases__. You must always have some base cases, which can be solved without recursion.
* __Making progress__. For the cases that are to be solved recursively, the recursive call must
always be to a case that makes progress toward a base case.
* __Design rule__. Assume that all the recursive calls work.
* __Compound interest rule__. Never duplicate work by solving the same instance of a problem in
separate recursive calls.

{% highlight scala %}
// tail recursion: Euclid's algorithm
def gcd(a: Int, b: Int): Int =
  if (b == 0) a
  else gcd(b, a % b)

// not tail recursion: to many bookkeeping
def factorial(n: Int): Int =
  if (n == 0) 1 else n * factorial(n - 1)

// refactoring
def fact(n: Int): Int = {
  def loop(sum: Int, rem: Int): Int =
    if (rem == 0) sum
    else loop(sum * rem, rem - 1)
  loop(1, n)
}
{% endhighlight %}

### 高阶函数

函数可以作为__参数__或__返回值__
{% highlight scala %}
def id(x: Int): Int = x
def cube(x: Int): Int = x * x * x
def fact(x: Int): Int = if (x == 0) 1 else x * fact(x - 1)

// 计算a与b之间的数的和
def sumInts(a: Int, b: Int): Int =
  if (a > b) 0 else a + sumInts(a + 1, b)

// 计算a与b之间的数的立方和
def sumCubes(a: Int, b: Int): Int =
  if (a > b) 0 else cube(a) + sumCubes(a + 1, b)

// 计算a与b之间的数的阶乘的和
def sumFactorials(a: Int, b: Int): Int =
  if (a > b) 0 else fact(a) + sumFactorials(a + 1, b)

/* 函数作为参数 */
def sum(f: Int => Int, a:  Int, b: Int): Int =
  if (a > b) 0
  else f(a) + sum(f, a + 1, b)

// 对高阶函数进行尾递归优化
def sum(f: Int => Int, a: Int, b: Int) = {
  def loop(a: Int, sum: Int): Int =
    if (a > b) sum
    else loop(a + 1, f(a) + sum)
  loop(a, 0)
}

/* 现在只需要传递函数就可以组合成高阶函数 */
def sumInts(a: Int, b: Int) = sum(id, a, b)
def sumCubes(a: Int, b: Int) = sum(cube, a, b)
def sumFactorials(a: Int, b: Int) = sum(fact, a, b)

// 引入匿名函数
def sumInts(a: Int, b: Int) = sum(x => x, a, b)
def sumCubes(a: Int, b: Int) = sum(x => x * x * x, a, b)
def sumFactorials(a: Int, b: Int) = sum(fact, a, b)
{% endhighlight %}

### 柯里化

* 接受多个参数的函数变换为接受一个参数的函数,并返回接受余下参数的新函数
{% highlight scala %}
// sum is now a function that returns another function
def sum(f: Int => Int): (Int, Int) => Int = {
  def sumF(a: Int, b: Int): Int =
    if (a > b) 0
    else f(a) + sumF(a + 1, b)
  sumF
}

// 其他函数可以这样定义
def sumInts = sum(x => x)
def sumCubes = sum(x => x * x * x)
def sumFactorials = sum(fact)

// 调用还是和原来一样
sumCubes(1, 10)
sumFactorials(10, 20)

// 还有更简便的形式,省略了定义那一步
sum(fact) (10, 20) == (sum (fact))(10, 20)

// 多参数列表,留意冒号位置
def sum(f: Int => Int)(a: Int, b: Int): Int =
  if (a > b) 0
  else f(a) + sum(f)(a + 1, b)

// 接受一个函数,和两个整型参数,返回整型
def product(f: Int => Int)(a: Int, b: Int): Int =
  if (a > b) 1
  else f(a) * product(f)(a + 1, b)

// 阶乘函数可以这样定义
def factorial(n: Int) = product(x => x)(1, n)
{% endhighlight %}

{% highlight scala %}
// sum和product几乎一样,再次抽象,映射归约的思想
def mapReduce(f: Int => Int, combine: (Int, Int) => Int, base: Int)
(a: Int, b: Int): Int = {
  if (a > b) base
  else combine(f(a), mapReduce(f, combine, base)(a + 1, b))
  }
// 此时product和sum可以这样定义
def sum(f: Int => Int)(a: Int, b: Int): Int =
  mapReduce(f, (x, y) => x + y, 0)(a, b)

def product(f: Int => Int)(a: Int, b: Int): Int =
  mapReduce(f, (x, y) => x * y, 1)(a, b)
{% endhighlight %}

### Finding fixed point

* 欺负我数学不好 T_T  
* fixed point: 如果一个数x满足f(x) = x, 就称之为方程的fixed point. 没理解错的话,就是y=x和y=f(x)的交点  
* 于是可通过重复的迭代 x, f(x), f(f(x)), f(f(f(x))), ... 求出
{% highlight scala %}
val tolerance  = 0.0001
// 判断是否满足所需精度
def isClosedEnough(x: Double, y: Double) =
  abs((x - y) / x) / x < tolerance
// 接受一个函数和初值并计算fixed point
def fixedPoint(f: Double => Double)(firstGuess: Double) = {
  def iterate(guess: Double): Double = {
    val next = f(guess)
    if (isCloseEnough(guess, next)) next
    else iterate(next)
  }
  iterate(firstGuess)
}
fixedPoint(x => 1 + x/2)(1.0)  // 计算出一个接近2的数

// fixedPoint(x => 2 / x)(1.0)
/* 上面的调用不能计算出fixed point, 就是根号2, 循环无法中止
 * guess的值在1和2之间变化, 控制变化差异, 取均值
 */
fixedPoint(x => (x + 2 / x) / 2)(1.0) // 计算出1.414....

// 继续抽象
def averageDamp(f: Double => Double)(x: Double) = (x + f(x)) / 2
/* sqrt 可以这样定义, 这里有一点tricky, averageDamp接受一个
 * 函数,并返回一个高阶匿名函数再传入fixedPoint中
 */
def sqrt(x: Double) =
  fixedPoint(averageDamp(y => x / y))(1)
{% endhighlight %}

- - -

### Syntax summary

#### Types

    Type         = SimepleType | FunctionType
    FunctionType = SimpleType '=>' Type
    SimpleType   = Ident
    Types        = Type { ',' Type }

#### Expressions

    Expr         = InfixExpr | FunctionExpr | if '(' Expr ')' Expr else Expr
    InfixExpr    = PrefixExpr | InfixExpr Operator InfixExpr
    Operator     = ident
    PrefixExpr   = ['+' | '-' | '!' | '~'] SimepleExpr
    SimepleExpr  = ident | literal | SimepleExpr '.' ident | Block
    FunctionExpr = Bindings '=>' Expr
    Bindings     = ident [':' SimpleType] | '(' [Binding {',' Binding}] ')'
    Bingding     = ident [':' Type]
    Block        = '{' {Def ';'} Expr '}'

#### Definitions

    Def          = FunDef | ValDef
    FunDef       = def ident {'(' [Parameters] ')'} [':' Type] '=' Expr
    ValDef       = val ident [':' Type] '=' Expr
    Parameter    = ident ':' [ '=>' ] Type
    Parameters   = Parameter {',' Parameter}
