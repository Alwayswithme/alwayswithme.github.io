---
layout       :  post
title        :  "JDBC 的代码简化"
date         :  2017-02-21 11:01:53
categories   :  jekyll update
---

很多JDBC的教程和博文还在用较旧的方式来访问数据库。  
利用 Java 6 的 `JDBC 4.0 API` 和 Java 7 的 `try-with-resources` 语法可以大大简化冗长的代码。


Java 7 以前的写法
----------
可以看到有很多资源清理的操作，也要手动装载 JDBC 驱动
```java
    private static final String url = "jdbc:mysql://localhost";
    private static final String user = "root";
    private static final String pass = "passwd";
    private static final String statement = "SHOW DATABASES";
    
    public static void priorJava7JDBC() {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        try {
            Class.forName("com.mysql.jdbc.Driver");  // 注册驱动

            conn = DriverManager.getConnection(url, user, pass); // 打开连接

            stmt = conn.createStatement();
            rs = stmt.executeQuery(statement);  // 执行语句

            // 处理结果
            while (rs.next()) {
                System.out.println(rs.getString("Database"));
            }
            // 资源清理
            rs.close();
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            closeQuietly(rs);
            closeQuietly(stmt);
            closeQuietly(conn);
        }
    }

    public static void closeQuietly(AutoCloseable closeable) {
        try {
            if(closeable != null) {
                closeable.close();
            }
        } catch (Exception e) {
        }
    }
```


Java 7 之后的写法
--------------
通过`try-with-resources` 省略了资源清理的代码，类似与 Python 的 `with` 语法，也无需注册驱动
```java
    public static void afterJava7JDBC() {
        try (Connection connection = DriverManager.getConnection(url, user, pass);
             PreparedStatement stmt = connection.prepareStatement(statement)) {
            try (ResultSet rs = stmt.executeQuery()) {

                while(rs.next()) {
                    System.out.println(rs.getString("Database"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
```

try-with-resources 异常处理方式
--------------
try-with-resources 可以理解为自动调用 close 方法的语法糖，但异常处理有差异，看下面的例子
```java
static String readFirstLineFromFileWithFinallyBlock(String path)
                                                     throws IOException {
    BufferedReader br = new BufferedReader(new FileReader(path));
    try {
        return br.readLine();
    } finally {
        if (br != null) br.close();
    }
}

static String readFirstLineFromFile(String path) throws IOException {
    try (BufferedReader br =
                   new BufferedReader(new FileReader(path))) {
        return br.readLine();
    }
}

```
*readFirstLineFromFileWithFinallyBlock*方法如果 readLine 和 close 同时抛出异常，方法的异常会是 *finally* 语句块的异常。*try* 语句块的异常被suppressed。
相比之下，*readFirstLineFromFile*方法如果 readLine 和 try-with-resources 调 close 方法都抛出异常，方法的异常会是 *try* 语句块的异常，即 readLine 的异常，
try-with-resources 的异常被suppressed。可以通过抛出的异常调用 Throwable.getSuppressed 方法获得 try-with-resources 的异常。

原文描述如下：
>However, in this example, if the methods readLine and close both throw exceptions, then the method readFirstLineFromFileWithFinallyBlock throws the exception thrown from the finally block; the exception thrown from the try block is suppressed. In contrast, in the example readFirstLineFromFile, if exceptions are thrown from both the try block and the try-with-resources statement, then the method readFirstLineFromFile throws the exception thrown from the try block; the exception thrown from the try-with-resources block is suppressed. In Java SE 7 and later, you can retrieve suppressed exceptions; see the section Suppressed Exceptions for more information.

还可以更简便吗
-----------
上面的代码虽然有一定程度简化，但还是需要打开连接、执行语句、遍历结果集等操作，
通过 Spring 的 `JdbcTemplate` 配合 Java 8 的流式api以及lambda表达式可以让代码变得更加简洁，接近One-Liners。例如：
```java
jdbcTemplate.query(
        "SELECT id, first_name, last_name FROM customers WHERE first_name = ?", new Object[] { "Josh" },
        (rs, rowNum) -> new Customer(rs.getLong("id"), rs.getString("first_name"), rs.getString("last_name"))
).forEach(customer -> log.info(customer.toString()));
```
具体可看[教程](https://spring.io/guides/gs/relational-data-access/)

See Also
--------
-   [JDBC 4.0 Enhancements in Java SE 6](http://archive.oreilly.com/pub/a/onjava/2006/08/02/jjdbc-4-enhancements-in-java-se-6.html)
-   [JDBC 4.0 and 4.1 features](http://docs.oracle.com/javadb/10.8.3.0/ref/rrefjdbc4_0summary.html)
-   [The try-with-resources Statement](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)

