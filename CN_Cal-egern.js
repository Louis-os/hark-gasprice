/**
 * 双周日历（Hark 脚本版 / Egern DSL）
 * 基于 IBL3ND/CN_Cal.JS 改版
 *
 * 样式：油价小组件原始配色（浅色三段渐变 + 白色玻璃 + 金色强调），日期格只显示数字
 * 功能：
 *  • 法定节假日（放假）：日期数字显示红色
 *  • 调休上班日：日期下方小蓝点
 *  • 今日黄历：底部显示农历日期、建除十二神与宜/忌
 *
 * 数据：
 *  • 2026 年节假日依据国务院办公厅《关于2026年部分节假日安排的通知》
 *  • 建除十二神按《协纪辨方书》月建起建法推算，宜忌取建除歌诀
 */

// ── 工具 ─────────────────────────────────────────────
function fmtYMD(y, m, d) { return y + "-" + m + "-" + d; }

// ============ 农历 ============
var lunarInfo = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
];
function lYearDays(y){var s=348;for(var i=0x8000;i>0x8;i>>=1)s+=((lunarInfo[y-1900]&i)?1:0);return s+leapDays(y);}
function leapDays(y){return leapMonth(y)?((lunarInfo[y-1900]&0x10000)?30:29):0;}
function leapMonth(y){return lunarInfo[y-1900]&0xf;}
function monthDays(y,m){return(lunarInfo[y-1900]&(0x10000>>m))?30:29;}
function getLunarDate(date){
  var offset=Math.floor((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(1900,0,31))/86400000);
  var i,tmp=0;
  for(i=1900;i<2100&&offset>0;i++){tmp=lYearDays(i);offset-=tmp;}
  if(offset<0){offset+=tmp;i--;}
  var year=i,leap=leapMonth(i),isLeap=false;
  for(i=1;i<13&&offset>0;i++){
    if(leap>0&&i===leap+1&&!isLeap){i--;isLeap=true;tmp=leapDays(year);}
    else tmp=monthDays(year,i);
    if(isLeap&&i===leap+1)isLeap=false;
    offset-=tmp;
  }
  if(offset===0&&leap>0&&i===leap+1){if(isLeap)isLeap=false;else{isLeap=true;i--;}}
  if(offset<0){offset+=tmp;i--;}
  return{year:year,month:i,day:offset+1,isLeap:isLeap};
}
var LUNAR_DAYS=['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
var LUNAR_MONTHS=['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
function lunarDayStr(date){
  var l=getLunarDate(date);
  return (l.isLeap?'闰':'')+LUNAR_MONTHS[l.month-1]+LUNAR_DAYS[l.day-1];
}

// ============ 节气（建除月建） ============
var SOLAR_TERM_OFFSETS=[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
var BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function monthBranch(date){
  var curDay=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
  var best=-1,bestMs=-1;
  var years=[date.getFullYear()-1,date.getFullYear()];
  for(var yi=0;yi<years.length;yi++){
    var yy=years[yi];
    for(var i=0;i<24;i+=2){
      var ms=Date.UTC(1900,0,6,2,5,0)+365.24219878*86400000*(yy-1900)+SOLAR_TERM_OFFSETS[i]*60000;
      var t=new Date(ms);
      var termDay=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate());
      if(termDay<=curDay&&ms>bestMs){bestMs=ms;best=i;}
    }
  }
  return ((best/2)+1)%12;
}

// ============ 干支 + 建除十二神 ============
var STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
function ganzhi(date){
  var offset=Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(1900,0,31))/86400000);
  var s=(((0+offset)%10)+10)%10, b=(((4+offset)%12)+12)%12;
  return{str:STEMS[s]+BRANCHES[b],branch:b};
}
var GODS=['建','除','满','平','定','执','破','危','成','收','开','闭'];
var GOD_GOOD={1:1,4:1,5:1,7:1,8:1,10:1}; // 除定执危成开吉
var GOD_YIJI=[
  {yi:'出行',ji:'开仓'},{yi:'疗病',ji:''},{yi:'修仓',ji:'嫁娶'},{yi:'平治',ji:''},
  {yi:'安床',ji:''},{yi:'捕捉',ji:''},{yi:'疗病',ji:''},{yi:'祈福',ji:''},
  {yi:'嫁娶',ji:''},{yi:'纳财',ji:''},{yi:'祈福',ji:''},{yi:'竖造',ji:''}
];
function jianchu(date){
  var g=ganzhi(date), mb=monthBranch(date);
  var god=(((g.branch-mb)%12)+12)%12;
  return{god:god,good:!!GOD_GOOD[god]};
}

// ============ 2026 法定节假日 / 调休 ============
var HOLIDAYS={
  2026:{
    off:['1-1~1-3','2-15~2-23','4-4~4-6','5-1~5-5','6-19~6-21','9-25~9-27','10-1~10-7'],
    work:['1-4','2-14','2-28','5-9','9-20','10-10']
  }
};
var HOLIDAY_SETS=(function(){
  var off={},work={};
  for(var year in HOLIDAYS){
    var data=HOLIDAYS[year],i,r,a,b,m1,d1,m2,d2,start,end,d;
    for(i=0;i<data.off.length;i++){
      r=data.off[i];
      if(r.indexOf('~')>=0){
        var p=r.split('~');a=p[0].split('-');b=p[1].split('-');
        m1=+a[0];d1=+a[1];m2=+b[0];d2=+b[1];
        start=new Date(+year,m1-1,d1);end=new Date(+year,m2-1,d2);
        for(d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
          off[d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()]=1;
        }
      }else{off[year+'-'+r]=1;}
    }
    for(i=0;i<data.work.length;i++){work[year+'-'+data.work[i]]=1;}
  }
  return{off:off,work:work};
})();
function dayType(d){
  var key=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  if(HOLIDAY_SETS.off[key])return 'off';
  if(HOLIDAY_SETS.work[key])return 'work';
  return '';
}

// ── DSL 帮助函数（Egern） ──────────────────────────
function t(text,sz,wt,color,extra){
  var el={type:"text",text:String(text),font:{size:sz,weight:wt||"regular"},textColor:color||"#000000"};
  if(extra)for(var k in extra)el[k]=extra[k];
  return el;
}
function ic(sym,sz,color){return{type:"image",src:"sf-symbol:"+sym,width:sz,height:sz,color:color};}
function sp(len){return len!=null?{type:"spacer",length:len}:{type:"spacer"};}
function row(children,opts){
  var el={type:"stack",direction:"row",alignItems:"center",children:children};
  if(opts)for(var k in opts)el[k]=opts[k];
  return el;
}

// ── 主函数 ────────────────────────────────────────────
export default async function(ctx){
  var now=new Date();
  var y=now.getFullYear(), m=now.getMonth(), d=now.getDate();
  function isToday(dt){return dt.getFullYear()===y&&dt.getMonth()===m&&dt.getDate()===d;}

  // 日期格
  function dateCell(dt){
    var today=isToday(dt), type=dayType(dt);
    var wd=dt.getDay(), weekend=(wd===0||wd===6), other=(dt.getMonth()!==m);
    var numColor="#000000";
    if(today)numColor="#FFB340";
    else if(type==='off')numColor="#FF453A";
    else if(other||weekend)numColor="#3C3C4399";
    var cell={
      type:"stack",direction:"column",alignItems:"center",justifyContent:"center",
      flex:1,gap:2,padding:[4,2,3,2],borderRadius:12,
      backgroundColor:today?"#FFB34055":"#FFFFFFA6",
      children:[
        t(String(dt.getDate()),17,today?"bold":"medium",numColor),
        {type:"stack",width:3,height:3,borderRadius:1.5,
         backgroundColor:type==='work'?"#64A8FF":"#00000000",children:[]}
      ]
    };
    if(today){cell.borderWidth=1;cell.borderColor="#FFB340";}
    return cell;
  }

  // 双周
  var weeks=[];
  var first=new Date(y,m,1), start=new Date(first);
  start.setDate(start.getDate()-first.getDay());
  // 找到包含今天的那一周
  var weekStart=new Date(now);weekStart.setDate(weekStart.getDate()-weekStart.getDay());
  for(var w=0;w<2;w++){
    var cells=[];
    for(var i=0;i<7;i++){
      var dt=new Date(weekStart);dt.setDate(weekStart.getDate()+w*7+i);
      cells.push(dateCell(dt));
    }
    weeks.push(row(cells,{gap:4}));
  }

  // 星期头
  var weekHeader=row(["日","一","二","三","四","五","六"].map(function(x){
    return{type:"stack",flex:1,alignItems:"center",justifyContent:"center",children:[t(x,11,"medium","#3C3C4399")]};
  }),{gap:4});

  // 头部
  var header=row([
    ic("calendar",16,"#FFB340"),
    t((m+1)+"月",17,"bold","#000000"),
    sp(),
    t(String(y),13,"medium","#3C3C4399")
  ],{gap:6});

  // 黄历
  var jc=jianchu(now), yiji=GOD_YIJI[jc.god];
  var footKids=[
    t("黄历",10,"medium","#3C3C4399"),
    t(lunarDayStr(now),10,"medium","#000000"),
    t(GODS[jc.god]+"日",10,"bold",jc.good?"#FFB340":"#FF453A"),
    sp(),
    t("宜 "+yiji.yi,10,"medium","#000000")
  ];
  if(yiji.ji)footKids.push(t("忌 "+yiji.ji,10,"medium","#3C3C4399"));
  var footer=row(footKids,{gap:6,padding:[9,12,9,12],borderRadius:14,backgroundColor:"#FFFFFFA6"});

  return{
    type:"widget",
    padding:[12,12,12,12],
    borderRadius:22,
    backgroundGradient:{
      type:"linear",
      colors:["#FFF6EA","#F4F0FF","#EEF6FF"],
      stops:[0,0.5,1],
      startPoint:{x:0,y:0},
      endPoint:{x:1,y:1}
    },
    children:[
      header,
      sp(6),
      weekHeader,
      sp(2),
      weeks[0],
      sp(6),
      weeks[1],
      sp(4),
      footer
    ]
  };
}
