---
layout       :  post
title        :  "FlashPolicy Server Using Netty"
date         :  2014-11-09 17:35:16
categories   :  jekyll update
---
## Flash安全策略
客户端发送字符串以`NULL`结尾的请求字符串`<policy-file-request/>`到服务器  
服务器返回策略文件响应，内容如下：
{% highlight xml %}
<?xml version="1.0"?> 
<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">
<!-- Policy file for xmlsocket://socks.example.com --> 
<cross-domain-policy> 
<!-- This is a master-policy file --> 
  <site-control permitted-cross-domain-policies="master-only"/> 
  <!-- Instead of setting to-ports="*", administrators can use ranges and commas --> 
  <!-- This will allow access to ports 123, 456, 457, and 458 --> 
  <allow-access-from domain="swf.example.com" to-ports="123,456-458" /> 
</cross-domain-policy> 
{% endhighlight %}

## 使用Netty的NIO方式实现
传统的ServerSocket.accept()方式会在每次调用都会阻塞，每一个Socket连接都需要启动新线程。
Netty则可以用非阻塞异步的方式处理请求，而且自带大部分编解码器可以完成需求。

* DelimiterBasedFrameDecoder 将接收到的ByteBuf按指定分隔符分割，此处需要用到Delimiters.nulDelimiter()
* StringDecoder和StringEncoder 将读入或写出的ByteBUf解编码为String
* IdleStateHandler 读超时事件触发时，可以及时关闭Channel

此外，还需要自己实现一个Handler返回策略文件内容。

## Java代码
{% highlight java %}
public class FlashPolicyHandler  extends SimpleChannelInboundHandler<String> {
  private static String xml = "<?xml version=\"1.0\"?>" +
    "<!DOCTYPE cross-domain-policy SYSTEM \"/xml/dtds/cross-domain-policy.dtd\">" +
    "<cross-domain-policy>"
    + "<allow-access-from domain=\"*\" to-ports=\"80,8080\"/>"
    + "</cross-domain-policy>\0";


  @Override
  public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
    if (evt instanceof IdleStateEvent) {
      IdleStateEvent state = (IdleStateEvent) evt;
      if (state.state() == IdleState.READER_IDLE) {
        ctx.writeAndFlush(Unpooled.EMPTY_BUFFER).addListener(ChannelFutureListener.CLOSE);
      }
    }
    super.userEventTriggered(ctx, evt);
  }

  private boolean validate(String msg) {
    return msg.indexOf("<policy-file-request/>") >= 0;
  }

  @Override
  protected void channelRead0(ChannelHandlerContext ctx, String msg) throws Exception {
    if (validate(msg)) {
      ctx.writeAndFlush(xml).addListener(ChannelFutureListener.CLOSE);
    } else {
      ctx.writeAndFlush("Quest Error \0").addListener(ChannelFutureListener.CLOSE);
    }
  }
}
{% endhighlight %}

[完整代码](https://github.com/Alwayswithme/FlashPolicyServer)  
[see also](http://www.adobe.com/devnet/flashplayer/articles/socket_policy_files.html)  
