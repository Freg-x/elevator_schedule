//为某些编译器设定的debug模式

var DEBUG_MODE = true;


//规定常变量

var TOTAL_ELE = 5;

var INSIDE = 0;
var OUTSIDE_UP = 1;
var OUTSIDE_DOWN = 2;

var MAX_FLOOR = 20;
var MIN_FLOOR = 0;

//与五部电梯相关的动态数组

var Requests = new Array(TOTAL_ELE);

var Inside = new Array(TOTAL_ELE);

var OutsideUp = new Array(TOTAL_ELE);

var OutsideDown = new Array(TOTAL_ELE);

var Timer = new Array(TOTAL_ELE);

var NeedToStop = [true, true, true, true, true];

var IsGoingUp = [true, true, true, true, true];

var IsRunning = [false, false, false, false, false];

var currentfloor = [1, 1, 1, 1, 1];


//初始化所有与队列相关的动态数组
//初始化添加指示框

function init() {
  for (var i = 0; i < TOTAL_ELE; i++) {
    Requests[i] = [];
    Inside[i] = [];
    OutsideUp[i] = [];
    OutsideDown[i] = [];
    Timer[i] = setInterval("run(" + i + ")", 1000);

  }
  $("#info").mCustomScrollbar({
    scrollButtons: {
      enable: true
    },

  });

}

$(document).ready(init);


//主要函数部分





//将请求送入电梯的请求队列中并更新电梯状态的函数

function dial(ele_number, floor) {
  Requests[ele_number].push(floor);

  if (!IsRunning[ele_number]) updateStatus(ele_number);

}



//在外部点击下行按钮时将要执行的函数


$(".outside_up").click(function() {

  var floor_id = $(this).parent()[0].id;
  var call_floor = Number(floor_id.substr(5));       //计算出发出请求的楼层数

  if (isNaN(call_floor)) throw new Error("fail to receive outside_up floor");

  var text = "第 " + call_floor + " 层的外部上行按钮被点按了";    //初始化提示信息
  var p = $("<p></p>").text(text);
  $(".mCSB_container").append(p);           //将提示信息的文本段加入到滚动框对象中,同时将滚动条滑动到最后
  $("#info").mCustomScrollbar("scrollTo", "last");



  var min_distance = 2 * (MAX_FLOOR - MIN_FLOOR);
  var distance = 0;
  var elevator_to_push = 0;

//下面的代码段给出了计算调度电梯的方法
//它将返回一个最小距离和具备这个最小距离的电梯编号
//首先,对电梯是否有其他请求进行分类
//之后,对呼叫层与当前层的高低关系进行分类
//最后,对电梯的运行方向进行分类
//这里的countgaps函数将在最后方进行定义,它代表了电梯在过程中需要停下来几次


  for (var i = 0; i < TOTAL_ELE; i++) {

    if (!IsRunning[i]) distance = Math.abs(call_floor - currentfloor[i]);
    else {

      var min_in_queue = getMinInQueue(i);
      var max_in_queue = getMaxInQueue(i);

      if (currentfloor[i] <= call_floor) {
        if (IsGoingUp[i]) {
          distance = call_floor - currentfloor[i] + 5 * countGaps(call_floor, currentfloor[i], i);
        } else {
          distance = currentfloor[i] - min_in_queue + call_floor - min_in_queue + 5 * countGaps(call_floor, min_in_queue, i);
        }
      } else {
        if (IsGoingUp[i]) {
          distance = max_in_queue - currentfloor[i] + max_in_queue - min_in_queue + Math.abs(min_in_queue - call_floor) + 5 * countGaps(max_in_queue, min_in_queue, i);
        } else {
          distance = currentfloor[i] - min_in_queue + Math.abs(min_in_queue - call_floor) + 5 * countGaps(currentfloor[i], min_in_queue, i);
        }
      }
    }
    if (distance < min_distance) {
      min_distance = distance;
      elevator_to_push = i;
    }

  }

  if (OutsideUp[elevator_to_push][call_floor] != 1) {
    OutsideUp[elevator_to_push][call_floor] = 1;
    dial(elevator_to_push, call_floor);
    $(this).addClass("on");  //将按钮保持开启状态
  }


});


//在外部点击下行按钮时的响应函数,结构与上行对称

$(".outside_down").click(function() {

  var floor_id = $(this).parent()[0].id;
  var call_floor = Number(floor_id.substr(5));

  if (isNaN(call_floor)) throw new Error("fail to receive outside_down floor");

  var text = "第 " + call_floor + " 层的外部下行按钮被点按了";
  var p = $("<p></p>").text(text);
  $(".mCSB_container").append(p);
  $("#info").mCustomScrollbar("scrollTo", "last");


  var min_distance = 2 * (MAX_FLOOR - MIN_FLOOR);
  var distance = 0;
  var elevator_to_push = 0;

  for (var i = 0; i < TOTAL_ELE; i++) {

    if (!IsRunning[i]) distance = Math.abs(call_floor - currentfloor[i]);
    else {

      var min_in_queue = getMinInQueue(i);
      var max_in_queue = getMaxInQueue(i);

      if (currentfloor[i] >= call_floor) {
        if (IsGoingUp[i]) {
          distance = max_in_queue - currentfloor[i] + max_in_queue - call_floor + 5 * countGaps(max_in_queue, call_floor, i);
        } else {
          distance = currentfloor[i] - call_floor + 5 * countGaps(call_floor, currentfloor[i], i);
        }
      } else {
        if (IsGoingUp[i]) {
          distance = max_in_queue - currentfloor[i] + Math.abs(max_in_queue - call_floor) + 5 * countGaps(currentfloor[i], max_in_queue, i);
        } else {
          distance = currentfloor[i] - min_in_queue + max_in_queue - min_in_queue + Math.abs(max_in_queue - call_floor) + 5 * countGaps(min_in_queue, max_in_queue, i);
        }
      }
    }
    if (distance < min_distance) {
      min_distance = distance;
      elevator_to_push = i;
    }

  }

  if (OutsideDown[elevator_to_push][call_floor] != 1) {
    OutsideDown[elevator_to_push][call_floor] = 1;
    dial(elevator_to_push, call_floor);
    $(this).addClass("on");
  }


});




//在内部点击不同楼层时的对应函数
//不需要冗长的分类,因为这个请求一定由本部电梯处理


$(".dial").click(function() {
  var this_id = $(this)[0].id;
  var ele_number = Number(this_id.substr(1, 1));
  var call_floor = Number(this_id.substr(7));
  var text = "编号为 " + ele_number + " 的电梯内部的第 " + call_floor + " 层按钮被点按了";
  var p = $("<p></p>").text(text);
  $(".mCSB_container").append(p);
  $("#info").mCustomScrollbar("scrollTo", "last");

  if (Inside[ele_number][call_floor] != 1) {
    Inside[ele_number][call_floor] = 1;
    dial(ele_number, call_floor);
    $(this).addClass("pressed");
  }

});

//更新currentloor
//这个函数定义并不完美,从逻辑上讲,它应当同门的移动动画在一起更新

function moveUp(ele_number) {
  if (currentfloor[ele_number] < MAX_FLOOR) currentfloor[ele_number]++;
}

function moveDown(ele_number) {
  if (currentfloor[ele_number] > 1) currentfloor[ele_number]--;
}





//实现多线程最关键的函数
//在一开始,五部电梯将反复执行这一个函数
//它将判断电梯在当前楼层需不需要停
//由于五部电梯在反复判断,故可以实现即使停止和运行


function run(ele_number) {

  var text;
  var p;
  if (IsRunning[ele_number]) {

    NeedToStop[ele_number] = false;

    if (Requests[ele_number].indexOf(currentfloor[ele_number]) > -1) {

      if (Inside[ele_number][currentfloor[ele_number]] == 1) {
        shutLights(ele_number, currentfloor[ele_number], INSIDE);
        removeFromQueue(ele_number, currentfloor[ele_number]);
        Inside[ele_number][currentfloor[ele_number]] = 0;
        NeedToStop[ele_number] = true;

        text = "来自 " + ele_number + " 号电梯 " + currentfloor[ele_number] + " 层的内部乘客出门";
        p = $("<p></p>").text(text);
        $(".mCSB_container").append(p);
        $("#info").mCustomScrollbar("scrollTo", "last");


      }

      if (IsGoingUp[ele_number]) {
        if (OutsideUp[ele_number][currentfloor[ele_number]] == 1) {
          shutLights(ele_number, currentfloor[ele_number], OUTSIDE_UP);
          removeFromQueue(ele_number, currentfloor[ele_number]);
          OutsideUp[ele_number][currentfloor[ele_number]] = 0;
          NeedToStop[ele_number] = true;

          text = "在 " + currentfloor[ele_number] + " 层外部等候的乘客通过 " + ele_number + " 号电梯进门上行";
          p = $("<p></p>").text(text);
          $(".mCSB_container").append(p);
          $("#info").mCustomScrollbar("scrollTo", "last");

        }
        if (OutsideDown[ele_number][currentfloor[ele_number]] == 1 && currentfloor[ele_number] == getMaxInQueue(ele_number)) {
          shutLights(ele_number, currentfloor[ele_number], OUTSIDE_DOWN);
          removeFromQueue(ele_number, currentfloor[ele_number]);
          OutsideDown[ele_number][currentfloor[ele_number]] = 0;
          NeedToStop[ele_number] = true;


          text = "在 " + currentfloor[ele_number] + " 层外部等候的乘客通过 " + ele_number + " 号电梯进门下行";
          p = $("<p></p>").text(text);
          $(".mCSB_container").append(p);
          $("#info").mCustomScrollbar("scrollTo", "last");




        }
      } else {
        if (OutsideDown[ele_number][currentfloor[ele_number]] == 1) {
          shutLights(ele_number, currentfloor[ele_number], OUTSIDE_DOWN);
          removeFromQueue(ele_number, currentfloor[ele_number]);
          OutsideDown[ele_number][currentfloor[ele_number]] = 0;
          NeedToStop[ele_number] = true;

          text = "在 " + currentfloor[ele_number] + " 层外部等候的乘客通过 " + ele_number + " 号电梯进门下行";
          p = $("<p></p>").text(text);
          $(".mCSB_container").append(p);
          $("#info").mCustomScrollbar("scrollTo", "last");

        }
        if (OutsideUp[ele_number][currentfloor[ele_number]] == 1 && currentfloor[ele_number] == getMinInQueue(ele_number)) {
          shutLights(ele_number, currentfloor[ele_number], OUTSIDE_UP);
          removeFromQueue(ele_number, currentfloor[ele_number]);
          OutsideUp[ele_number][currentfloor[ele_number]] = 0;
          NeedToStop[ele_number] = true;

          text = "在 " + currentfloor[ele_number] + " 层外部等候的乘客通过 " + ele_number + " 号电梯进门上行";
          p = $("<p></p>").text(text);
          $(".mCSB_container").append(p);
          $("#info").mCustomScrollbar("scrollTo", "last");


        }
      }


//如果需要停,应防止继续执行本函数,清掉timer并播放开门关门动画
//在开门关门结束后重新设置timer

      if (NeedToStop[ele_number]) {
        if (Timer[ele_number]) clearInterval(Timer[ele_number]);

        setTimeout(function() {
          openDoor(ele_number);

          setTimeout(function() {
            closeDoor(ele_number);
            setTimeout(function() {
            Timer[ele_number] = setInterval("run(" + ele_number + ")", 1000);
            }, 2000);
          }, 2000);
        }, 1000);

      } else {
        if (IsGoingUp[ele_number]) moveUp(ele_number);
        else moveDown(ele_number);

      }




    } else {
      if (IsGoingUp[ele_number]) moveUp(ele_number);
      else moveDown(ele_number);
    }
    updateStatus(ele_number);

  }
  updateFloor(ele_number);

}

//开关门的小动画

function openDoor(ele_number) {
  $("#E" + ele_number + " .leftdoor").css("left", "-30px");
  $("#E" + ele_number + " .rightdoor").css("left", "60px");

}

function closeDoor(ele_number) {
  $("#E" + ele_number + " .leftdoor").css("left", "0px");
  $("#E" + ele_number + " .rightdoor").css("left", "30px");

}



//简单的提示信息显示


$(".call").click(function() {
  var parent_id = $(this).parent()[0].id;
  var ele_number = parent_id.substr(9);

  var text = "编号为 " + ele_number + " 的电梯请求通话!";
  var h = $("<h1></h1>").text(text);
  $(".mCSB_container").append(h);
  $("#info").mCustomScrollbar("scrollTo", "last");

});



$(".emergency").click(function() {
  var parent_id = $(this).parent()[0].id;
  var ele_number = parent_id.substr(9);

  var text = "编号为 " + ele_number + " 的电梯出现紧急情况!";
  var h = $("<h1></h1>").text(text);
  $(".mCSB_container").append(h);
  $("#info").mCustomScrollbar("scrollTo", "last");

});


//在用户想要主动开、关门时先判断当前楼层需不需要停
//运行过程中打开电梯门被归于非法行为给出警告
//注意这里的开门关门并不会影响timer
//这样做虽然导致了有其他任务时,即使你不断点击开门,它也最多等你五秒
//但成功但将对timer1对操作卡死在了run()函数内部
//保证了时间轴始终规整不错乱

$(".close").click(function() {
  var this_id = $(this)[0].id;
  var ele_number = Number(this_id.substr(6));
  var text;
  var p;
  if (NeedToStop[ele_number]) {



    closeDoor(ele_number);


    text = "编号为 " + ele_number + " 的电梯提前关闭了电梯门";
    p = $("<p></p>").text(text);
    $(".mCSB_container").append(p);
    $("#info").mCustomScrollbar("scrollTo", "last");
  } else {
    text = "编号为 " + ele_number + " 的电梯试图在运行过程中关门,被系统阻止";
    p = $("<p></p>").text(text);
    $(".mCSB_container").append(p);
    $("#info").mCustomScrollbar("scrollTo", "last");

  }
});




$(".open").click(function() {
  var this_id = $(this)[0].id;
  var ele_number = Number(this_id.substr(5));
  var text;
  var p;
  if (NeedToStop[ele_number]) {


    openDoor(ele_number);
    setTimeout(function() {
      closeDoor(ele_number);
    }, 1000);


    text = "编号为 " + ele_number + " 的电梯主动打开了电梯门";
    p = $("<p></p>").text(text);
    $(".mCSB_container").append(p);
    $("#info").mCustomScrollbar("scrollTo", "last");
  } else {
    text = "编号为 " + ele_number + " 的电梯试图非法开门,被系统阻止";
    p = $("<p></p>").text(text);
    $(".mCSB_container").append(p);
    $("#info").mCustomScrollbar("scrollTo", "last");

  }
});






//关灯的函数被写在了一起
//传入的参数中包含了method,它将对外部上行、外部下行和内部点按做出分类
//不同的关灯方法将执行不同的代码段


function shutLights(ele_number, floor, method) {
  if (method == OUTSIDE_UP) {
    $("#floor" + floor).children(".outside_up")[0].className = "outside_up button";
  } else if (method == OUTSIDE_DOWN) {
    $("#floor" + floor).children(".outside_down")[0].className = "outside_down button";
  } else if (method == INSIDE) {
    $("#E" + ele_number + "_dial" + floor).removeClass("pressed");

  }

}


//电梯门上下移动的小动画
//正如之前说的,应该将它与moveup和movedown函数写在一起,保证代码和逻辑关系的一致性

function updateFloor(ele_number) {
  var height = (currentfloor[ele_number] - 1) * 5;
  $("#E" + ele_number + " .door").css("bottom", height + "%");

  $("#floorOnScreen" + ele_number).text("" + currentfloor[ele_number]);

}




//更新isrunning和isgongingup数组
//顺便利用前两个数组的更新结果,完成对电梯内指示灯方向对更新

function updateStatus(n) {
  IsRunning[n] = (Requests[n].length > 0) ? true : false;

  if (currentfloor[n] == 1) {
    IsGoingUp[n] = true;
  } else if (currentfloor[n] == 20) {
    IsGoingUp[n] = false;
  } else {
    IsGoingUp[n] = (IsGoingUp[n] && (!IsRunning[n] || currentfloor[n] <= getMaxInQueue(n))) ? true : false;
    IsGoingUp[n] = (!IsGoingUp[n] && (!IsRunning[n] || currentfloor[n] >= getMinInQueue(n))) ? false : true;
  }

  if (!IsRunning[n]) {
    $("#uplight" + n).removeClass("turnon");
    $("#downlight" + n).removeClass("turnon");
  } else if (IsGoingUp[n]) {
    $("#downlight" + n).removeClass("turnon");
    $("#uplight" + n).addClass("turnon");
  } else {
    $("#uplight" + n).removeClass("turnon");
    $("#downlight" + n).addClass("turnon");
  }



}

//获取请求队列中对最高楼层

function getMaxInQueue(n) {
  if (Requests[n].length <= 0) {
    throw new Error("can't get max from an empty array.");
  }
  if (Requests[n].length == 1) {
    return Requests[n][0];
  } else {
    var max = Requests[n][0];
    for (var i in Requests[n]) {
      if (Requests[n][i] > max) {
        max = Requests[n][i];
      }
    }
    return max;
  }
}

// 获取请求队列中的最低楼层
function getMinInQueue(n) {
  if (Requests[n].length <= 0) {
    throw new Error("can't get min from an empty array.");

  }
  if (Requests[n].length == 1) {
    return Requests[n][0];
  } else {
    var min = Requests[n][0];
    for (var i in Requests[n]) {
      if (Requests[n][i] < min) {
        min = Requests[n][i];
      }
    }
    return min;
  }
}

//从队列中移除制定楼层

function removeFromQueue(n, floor) {

  if (Requests[n].indexOf(floor) < 0) {
    throw new Error("Can't remove non-existent floor from queue.");
  }
  if (Requests[n].length <= 0) {
    throw new Error("Can't remove floor from empty queue.");
  }
  for (var i = 0, len = Requests[n].length; i < len; i++) {
    if (Requests[n][i] == floor) {
      for (var j = i; j < len - 1; j++) {
        Requests[n][j] = Requests[n][j + 1];
      }
      Requests[n].pop();
      break;
    }
  }
}

//数在两层之间电梯需要停几次


function countGaps(higher, lower, n) {
  if (lower > higher) {
    var temp = lower;
    lower = higher;
    higer = temp;
  }

  var betweenNum = [];
  for (var i in Requests[n]) {
    if (Requests[n][i] <= higher && Requests[n][i] >= lower && betweenNum.indexOf(Requests[n][i] < 0)) {
      betweenNum.push(Requests[n][i]);
    }
  }
  return betweenNum.length;
}
