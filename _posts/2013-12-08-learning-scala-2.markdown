---
layout       :  post
title        :  Learning Scala - 2
date         :  2013-11-16 15:06:35
categories   :  jekyll update
---
### Functions and Data

1. 用class关键字封装数据
2. 用new关键字创建对象
3. 以'.'访问对象成员
4. 把函数封装成方法
{% highlight scala %}
class Rational(x: Int, y: Int) {
  def numer = x
  def denom = y
}

object rationals {
  val x = new Rational(1, 2) // new创建一个对象
  x.numer  // 用'.'访问该members
  x.denom
}
// implementing Rational Arithmetic
def addRational(r: Rational, s: Rational): Rational =
  new Rational(
      r.numer * s.denom + s.numer * r.denom,
      r.denom * s.denom)

def makeString(r: Rational) =
  r.numer + "/" + r.denom

makeString(addRational(new Rational(1, 2), new Rational(2, 3)))  // 7/6

// package functions in the data abstraction itself, AKA add class methods
class Rational(x: Int, y: Int) {
  def numer = x
  def denom = y

  def add(that: Rational) =
    new Rational(
        numer * that.denom + that.numer * denom,
        denom * that.denom)

  override def toString = numer + "/" + denom

  def neg: Rational = new Rational(-number, denom)

  /*
   *  Don't repeat yourself, idiot
   *  def sub(that: Rational) =
   *    new Rational(
   *      numer * that.denom - that.numer * denom,
   *      denom * that.denom)
   */
  def sub(that: Rational) = add(that.neg)
}
