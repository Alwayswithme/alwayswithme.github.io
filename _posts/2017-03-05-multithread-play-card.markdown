---
layout       :  post
title        :  "多线程模拟抓牌"
date         :  2017-03-05 11:00:39
categories   :  jekyll update
---

鹅厂笔试题
----------

请模拟斗地主抓牌，扑克牌的值为１～５４，随机选取地主，并从地主开始按顺序抓牌，直到牌剩余三张。要求，用线程模拟玩家抓牌。


思路
---------

用三个线程表示玩家，三个线程编号。对剩余的牌数取模计算顺序，编号和顺序相同时，开始抓牌。否则等待。线程重复执行，直到每个线程拿到的牌数等于１７。

完整代码
---------
省略了随机选地主的过程，用 `Lock` 和 `Condition` 来进行线程同步。放到线程池执行，主线程调用 `shutdown()` 等待线程池的任务执行完。
```java
public class CardPlayer implements Runnable {

    private ReentrantLock lock;
    private Condition takeCard;

    private List<Integer> holdCard;
    private List<Integer> cardStack;
    private int order;
    private String name;

    public CardPlayer(ReentrantLock lock, Condition takeCard, List<Integer> cardStack, int order, String name) {
        this.lock = lock;
        this.takeCard = takeCard;
        this.cardStack = cardStack;
        this.order = order;
        this.name = name;
        this.holdCard = new ArrayList<>(17);
    }

    @Override
    public void run() {
        lock.lock();
        try {
            while (holdCard.size() < 17) {
                while ((54 - cardStack.size()) % 3 != order) {
                    takeCard.await();
                }
                Integer card = cardStack.remove(0);
                holdCard.add(card);
                System.out.println(String.format("%-4s 拿到牌 %02d", name, card));
                takeCard.signalAll();
            }
            takeCard.signalAll();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        List<Integer> cardStack = IntStream.rangeClosed(1, 54).boxed().collect(Collectors.toList());
//        Collections.shuffle(list);

        ReentrantLock lock = new ReentrantLock();
        Condition takeCard = lock.newCondition();
        CardPlayer p1 = new CardPlayer(lock, takeCard, cardStack, 0, "地主");
        CardPlayer p2 = new CardPlayer(lock, takeCard, cardStack, 1, "农民1");
        CardPlayer p3 = new CardPlayer(lock, takeCard, cardStack, 2, "农民2");

        ExecutorService executorService = Executors.newFixedThreadPool(3);
        executorService.execute(p1);
        executorService.execute(p2);
        executorService.execute(p3);

        executorService.shutdown();
    }
}
```
