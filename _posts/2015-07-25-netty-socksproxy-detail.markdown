---
layout       :  post
title        :  "Netty Socks代理服务器源码分析"
date         :  2015-07-25 16:34:23
categories   :  jekyll update
---

文中出现的代码片段可于 netty example 中的 
[socksproxy](https://github.com/netty/netty/tree/master/example/src/main/java/io/netty/example/socksproxy) 找到。  
主要配合 [rfc1928](https://www.ietf.org/rfc/rfc1928.txt) 讲解 Socks5 的实现。

### 程序入口

main 函数位于 io.netty.example.socksproxy.SocksServer.

{% highlight java %}
public final class SocksServer {

    static final int PORT = Integer.parseInt(System.getProperty("port", "1080"));

    public static void main(String[] args) throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .handler(new LoggingHandler(LogLevel.INFO))
             .childHandler(new SocksServerInitializer());
            b.bind(PORT).sync().channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
{% endhighlight %}

这里主要启动了一个默认监听1080端口的服务器, 对于每一个 accept 进来的请求, 将由 `SocksServerInitializer` 往 pipeline 里添加的 handler 处理。

{% highlight java %}
// io.netty.example.socksproxy.SocksServerInitializer
public void initChannel(SocketChannel ch) throws Exception {
  ch.pipeline().addLast(
        // 开始主要就是这三个handler
        new LoggingHandler(LogLevel.DEBUG),  // 作用为输出日志，因此不用深究
        new SocksPortUnificationServerHandler(),
        SocksServerHandler.INSTANCE);
}
{% endhighlight %}

### 客户端发送 Socks5 初始请求

于 RFC 文档中可以得知此请求是这样的：

> The client connects to the server, and sends a version identifier/method selection message:
>
>     +----+----------+----------+
>     |VER | NMETHODS | METHODS  |
>     +----+----------+----------+
>     | 1  |    1     | 1 to 255 |
>     +----+----------+----------+

上面的数字表示这个协议包的各字段字节长度。由于是 Socks5 ， VER 是 0x05。  
简单起见， 一个不需要认证的请求会包含三个字节，分别是 0x05、0x01、0x00。
第二个字节是 METHODS 的长度，第三个字节 NOAUTH 协议规定为 0x00。  

接下来看 netty 中如何处理这个请求，前面提到 `SocksPortUnificationServerHandler` 将负责处理这个请求。处理逻辑在其 decode 方法:

{% highlight java %}
// 篇幅原因，删掉部分代码，具体请参阅io.netty.handler.codec.socksx.SocksPortUnificationServerHandler
protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
    ChannelPipeline p = ctx.pipeline();
    final byte versionVal = in.getByte(readerIndex);   // 1
    SocksVersion version = SocksVersion.valueOf(versionVal);

    switch (version) {
    case SOCKS5:
        logKnownVersion(ctx, version);
        p.addAfter(ctx.name(), null, socks5encoder);  // 2
        p.addAfter(ctx.name(), null, new Socks5InitialRequestDecoder());  // 3
        break;
    }

    p.remove(this); // 4
}
{% endhighlight %}

可见 `SocksPortUnificationServerHandler` 主要用来判断 socks 版本号。
具体步骤可分为：

1. 先获取了一个字节，用来判断 Socks 版本号
2. 往 pipeline 加入 Socks5 编码器
3. 添加 `Socks5InitialRequestDecoder` 对该请求解码
4. `SocksPortUnificationServerHandler` 已完成任务，从 pipeline 中移除

### Socks5InitialRequestDecoder 解码请求

`Socks5InitialRequestDecoder` 实现了 `ReplayingDecoder` 可以用一种状态机式的方式解码二进制的请求：

{% highlight java %}
// 仍然删掉了部分异常检测、出错处理的代码
// io.netty.handler.codec.socksx.v5.Socks5InitialRequestDecoder
protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
    switch (state()) {
    case INIT: {
        final byte version = in.readByte();  // 1

        final int authMethodCnt = in.readUnsignedByte(); // 2

        final Socks5AuthMethod[] authMethods = new Socks5AuthMethod[authMethodCnt];
        for (int i = 0; i < authMethodCnt; i++) {
            authMethods[i] = Socks5AuthMethod.valueOf(in.readByte());
        }

        out.add(new DefaultSocks5InitialRequest(authMethods)); // 3
        checkpoint(State.SUCCESS); // 4
    }
    case SUCCESS: {
        int readableBytes = actualReadableBytes();
        if (readableBytes > 0) {
            out.add(in.readSlice(readableBytes).retain());
        }
        break;
    }
    }
}
{% endhighlight %}

具体步骤：

1. 读取版本号
2. 读取认证方法计数
3. 把初始请求的字节包转换为 `DefaultSocks5InitialRequest` 对象
4. 状态变为 SUCCESS ， 以后不再解码任何数据

上面第三步的提到的对象将在 `SocksServerHandler#messageReceived` 方法中接收，
这个方法处理 `Socks5InitialRequest` 的逻辑为：  
在 pipeline 顶端添加了 `Socks5CommandRequestDecoder` 负责解码接下来会收到的
 Command 请求， 并给客户端发送了采用 NOAUTH 的响应。

{% highlight java %}
if (socksRequest instanceof Socks5InitialRequest) {
    ctx.pipeline().addFirst(new Socks5CommandRequestDecoder());
    ctx.write(new DefaultSocks5InitialResponse(Socks5AuthMethod.NO_AUTH));
}
{% endhighlight %}

### 客户端发送 Socks5 命令请求

一旦方法协商完毕， 客户端继续发送请求：

> The SOCKS request is formed as follows:
> 
>        +----+-----+-------+------+----------+----------+
>        |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
>        +----+-----+-------+------+----------+----------+
>        | 1  |  1  | X'00' |  1   | Variable |    2     |
>        +----+-----+-------+------+----------+----------+

netty 的 example 仅实现 CONNECT 命令， 一个简单的 CONNECT 命令请求将由0x05、0x01、0x00、0x01、一个 INT 表示的 IPV4 地址， 一个 SHORT  表示的端口号组成，总共10个字节。  
第一个是 socks 协议版本号，第二个字节表示 CONNECT 命令，第三个保留字节必须为0x00，第四个0x01代表接下来的字节表示IPV4地址，IPV4地址可以用整型即四个字节表示，端口号0～65535可以用两个字节表示

### Socks5CommandRequestDecoder 解码请求

类似于 `Socks5InitialRequestDecoder`, `Socks5CommandRequestDecoder` 也是一个差不多的解码器。

{% highlight java %}
// io.netty.handler.codec.socksx.v5.Socks5CommandRequestDecoder
protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
    switch (state()) {
    case INIT: {
        final byte version = in.readByte();
    
        final Socks5CommandType type = Socks5CommandType.valueOf(in.readByte());
        in.skipBytes(1); // RSV
        final Socks5AddressType dstAddrType = Socks5AddressType.valueOf(in.readByte());
        final String dstAddr = addressDecoder.decodeAddress(dstAddrType, in);
        final int dstPort = in.readUnsignedShort();
    
        out.add(new DefaultSocks5CommandRequest(type, dstAddrType, dstAddr, dstPort));
        checkpoint(State.SUCCESS);
    }
    case SUCCESS: {
        int readableBytes = actualReadableBytes();
        if (readableBytes > 0) {
            out.add(in.readSlice(readableBytes).retain());
        }
        break;
    }
    }
}
{% endhighlight %}

具体步骤仍是依次读取每个字节并把请求转换为 `DefaultSocks5CommandRequest` 对象。  
`SocksServerHandler#messageReceived` 方法中接收，这个方法处理 `Socks5CommandRequest` 的逻辑为：

{% highlight java %}
else if (socksRequest instanceof Socks5CommandRequest) {
    Socks5CommandRequest socks5CmdRequest = (Socks5CommandRequest) socksRequest;
    if (socks5CmdRequest.type() == Socks5CommandType.CONNECT) {
        ctx.pipeline().addLast(new SocksServerConnectHandler()); // 1
        ctx.pipeline().remove(this);  // 2
        ctx.fireChannelRead(socksRequest); // 3
    } else {
        ctx.close();
    }
}
{% endhighlight %}

对于 CONNECT 命令：

1. pipeline 末端加入 `SocksServerConnectHandler`
2. 移除 `SocksServerHandler` 这个handler
3. 把这个 commandrequest 对象交给下一个 handler 处理。

此时 pipeline 中的 handler 应该是这样的：
    
    Socks5CommandRequestDecoder
         \|/
    LoggingHandler
         \|/
    Socks5ServerEncoder
         \|/
    Socks5InitialRequestDecoder
         \|/
    SocksServerConnectHandler

上面提到 `LoggingHandler` 只是输出日志，
两个 Decoder 此时都处于 SUCCESS 状态，不再处理任何数据。`Socks5ServerEncoder`则负责把响应信息编码为字节。  
即 commandrequest 最后由 `SocksServerConnectHandler` 处理。

### SocksServerConnectHandler 处理请求

对于 `Socks5CommandRequest` 对象， `SocksServerConnectHandler` 处理逻辑如下：

{% highlight java %}
if (message instanceof Socks5CommandRequest) {
    final Socks5CommandRequest request = (Socks5CommandRequest) message;
    Promise<Channel> promise = ctx.executor().newPromise();     // 1
    // ... omitting code
    final Channel inboundChannel = ctx.channel();
    b.group(inboundChannel.eventLoop())
            .channel(NioSocketChannel.class)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
            .option(ChannelOption.SO_KEEPALIVE, true)
            .handler(new DirectClientHandler(promise));  // 2

    // 3
    b.connect(request.dstAddr(), request.dstPort()).addListener(new ChannelFutureListener() {
        @Override
        public void operationComplete(ChannelFuture future) throws Exception {
            if (future.isSuccess()) {
                // Connection established use handler provided results
            } else {
                // Close the connection if the connection attempt has failed.
                ctx.channel().writeAndFlush( // 4
                        new DefaultSocks5CommandResponse(Socks5CommandStatus.FAILURE, request.dstAddrType()));
                SocksServerUtils.closeOnFlush(ctx.channel());
            }
        }
    });
}
{% endhighlight %}

具体步骤如下：

1. 先获取一个 Promise 对象，并注册了 Listener ，省略了这部分代码稍后分析
2. b 是一个 `Bootstrap` 给它的 `DirectClientHandler` 传递了 promise 对象
3. b 连接到指定的 IPV4 地址和端口
4. 连接失败时向客户端写出失败响应

`DirectClientHandler` 逻辑很简单，连接到指定地址成功后，`setSuccess` 让 Promise 的回调函数执行。
同时在这个 Promise 中放有一个 Channel 的引用。
{% highlight java %}
public void channelActive(ChannelHandlerContext ctx) {
    ctx.pipeline().remove(this);
    promise.setSuccess(ctx.channel());
}
{% endhighlight %}

在这里先明确两个概念：  
`DirectClientHandler` 中的 Channel 是 Socks 服务器与 IPV4 地址建立的，称为 `OutboundChannel`  
客户端与 Socks 服务器之间建立的 Channel 称为 `InboundChannel`  
因此， Promise 持有的是 `OutboundChannel`

### 让两个 Channel 对接实现代理

代理个人简单的理解，客户端发送的任何数据经过代理服务器，此处是 Socks，发送到指定的主机。  
指定主机发送的任何数据经过代理服务器，再传回客户端。代理服务器相当于一个中继点。

刚才省略了 Promise 上注册的 Listener 代码如下：

{% highlight java %}
promise.addListener(
        new FutureListener<Channel>() {
            @Override
            public void operationComplete(final Future<Channel> future) throws Exception {
                final Channel outboundChannel = future.getNow();   // 1
                if (future.isSuccess()) {
                    ChannelFuture responseFuture =   // 2
                            ctx.channel().writeAndFlush(new DefaultSocks5CommandResponse(
                                    Socks5CommandStatus.SUCCESS, request.dstAddrType()));

                    responseFuture.addListener(new ChannelFutureListener() { // 3
                        @Override
                        public void operationComplete(ChannelFuture channelFuture) {
                            ctx.pipeline().remove(SocksServerConnectHandler.this);  // 4
                            outboundChannel.pipeline().addLast(new RelayHandler(ctx.channel())); // 5
                            ctx.pipeline().addLast(new RelayHandler(outboundChannel));  // 6
                        }
                    });
                }
            }
        });
{% endhighlight %}

1. Promise 继承了 Future， 这里 future 即上文的 promise， 通过 `getNow` 获得 `OutboundChannel`
2. 向客户端写出成功响应，返回 responseFuture
3. 监听写出操作， 写出完成会回调注册 `ChannelFutureListener`
4. 移除 `SocksServerConnectHandler`
5. `OutboundChannel` 的 pipeline 增加持有 `InboundChannel` 的 `RelayHandler`
6. `InboundChannel` 的 pipeline 增加持有 `OutboundChannel` 的 `RelayHandler`

Relay 有中继、转达的意思， 其作用不言而喻：  
读到的任何信息都往其实例变量 relayChannel 写

{% highlight java %}
public void channelRead(ChannelHandlerContext ctx, Object msg) {
    if (relayChannel.isActive()) {
        relayChannel.writeAndFlush(msg);
    } else {
        ReferenceCountUtil.release(msg);
    }
}
{% endhighlight %}

最终效果

> client <===inbound===> socks server <===outbound===> host
