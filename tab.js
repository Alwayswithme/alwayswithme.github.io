function init() {
  var defaultShow = document.getElementById("tab-bar");
  defaultShow.children[0].children[0].className = "selected"; //0表示显示中文页面
  var page = document.getElementById("page-english");//隐藏英文页面
  page.style.display="none";
}

function show(obj) {
  hidden();   //隐藏两个页面
  var pageID = "page-"+obj.hash.substr(1);
  var showDiv = document.getElementById(pageID);
  fadeIn(showDiv, 100);
  var parentUl = obj.parentNode.parentNode;
  for (var i = 0, len = parentUl.childElementCount; i < len ; i++) {//遍历所有子节点
    parentUl.children[i].children[0].className = "";
  }//取消他们的类
  obj.className +="selected";
}

function hidden() {
  var eDiv = document.getElementById("page-english");
  var cDiv = document.getElementById("page-chinese");
  cDiv.style.display="none";
  eDiv.style.display="none";
}
function fadeIn(elem, speed) {
  speed = speed || 20;
  var val = 0;
  elem.style.display="block";
  (function(){
    elem.style.opacity = val;
    val += 0.25;
    if (val <= 1.0){
      setTimeout(arguments.callee, speed)
    }
  })();
}
