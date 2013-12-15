---
layout: post
title: "01背包"
date: 2013-11-03 14:26:51
categories: jekyll update
---

markdown不能写公式,不会latex,将就着先

0-1背包问题,1, 2, 3....i个物品,重量为Wi,价值为Vi
我们将在总重量不超过Y 的前提下，前i 种物品的总价值所能达到的最高值定义为MaxV(i , Y )。

MaxV(i , Y )的递推关系为：

* MaxV (0, Y ) = 0
* MaxV (i , 0) = 0
* 如果Wi > Y , MaxV (i , Y ) = MaxV (i - 1, Y )
* 如果Wi ≤ Y , MaxV (i , Y ) = max { MaxV (i - 1, Y ), Vi + MaxV (i - 1, Y - Wi ) }

max用以计算最大值,前一个参数是指不放入物品i的总价值,后一个参数表示在可以放入i时  
已有的价值加上物品i的价值通过计算MaxV(n , W)即得到最终结果。
{% highlight java linenos %}
public class knapsack {
    /* 背包最大负重 */
    public static final int MAX_WEIGHT = 5;

    private static class Item {
        public int weight;
        public int value;

        public Item(int w, int v) {
            weight = w;
            value = v;
        }
    }

    public static void main(String[] args) {
        // 物品清单
        Item[] items = { new Item(0, 0), new Item(2, 12), new Item(1, 10),
                new Item(3, 20), new Item(2, 15) };
        // 有itemList行,MAX_WEIGHT+1列的二维数组
        int[][] maxValue = new int[items.length][MAX_WEIGHT + 1];

        fillMaxValue(items, maxValue);
        // 此时maxValue也完成赋值
        // 可以回溯求出最优解
        weSelect(items, maxValue);
    }

    static void weSelect(Item[] items, int[][] maxValue) {
        int N = items.length;
        // 背包剩余空间
        int remainSpace = MAX_WEIGHT;
        for (int i = N - 1; i > 0; i--) {
            if (remainSpace >= items[i].weight) { // 剩余空间可以放入当前物品i
                // 总价值减去可以放入物品i时的总价值, remainValue为所剩价值
                int remainValue = maxValue[i][remainSpace]
                        - maxValue[i - 1][remainSpace - items[i].weight];
                if (remainValue == items[i].value) {
                    // remainValue与物品i的价值相等,说明是选择的一部分
                    remainSpace -= items[i].weight;
                    System.out.println("Item" + i + " is part of selection");
                }
            }
        }
    }

    static void fillMaxValue(Item[] items, int[][] maxValue) {
        // 没有物品放入,价值为0,即二维数组的第一行全部置0
        for (int w = 0; w <= MAX_WEIGHT; w++)
            maxValue[0][w] = 0;

        for (int i = 1; i < items.length; i++) {
            maxValue[i][0] = 0; // 背包负重为0,最大价值为0
            for (int w = 1; w <= MAX_WEIGHT; w++) {
                int before = maxValue[i - 1][w]; // 物品没有放入时的总价值
                if (items[i].weight <= w) { // 当前物品可以放入背包
                    int after = items[i].value
                            + maxValue[i - 1][w - items[i].weight];
                    maxValue[i][w] = Math.max(before, after);
                } else  // 当前物品不能放入背包,总价值保持不变
                    maxValue[i][w] = before;
            }
        }
        System.out.println("Given a pack can hold " + MAX_WEIGHT + "\n"
                + "The max value we can get is: "
                + maxValue[items.length - 1][MAX_WEIGHT]);
    }
}
{% endhighlight %}
