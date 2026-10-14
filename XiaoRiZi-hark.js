/**
 * 小日子（Hark 仪表盘版样式）
 * 农历信息 + 四类节日倒计时（法定 / 节气 / 民俗 / 国际）
 * 改编自 ByteValley today_almanac.js
 *
 * 样式：与「油价-Hark」统一（深浅色渐变 + 玻璃拟态 + 金色强调）
 */

// ── 工具 ─────────────────────────────────────────────
function fmtYMD(y, m, d) { return y + "-" + m + "-" + d; }

function dateDiff(a, b) {
  var pa = a.split("-"), pb = b.split("-");
  return Math.round(
    (new Date(+pb[0], +pb[1]-1, +pb[2]) - new Date(+pa[0], +pa[1]-1, +pa[2]))
    / 86400000
  );
}

function nthWeekday(year, month, wd, n) {
  var d1 = new Date(year, month - 1, 1);
  return fmtYMD(year, month, 1 + ((wd - d1.getDay() + 7) % 7) + (n - 1) * 7);
}

// ── 农历算法 ──────────────────────────────────────────
var C = {
  li:[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520],
  sm:[31,28,31,30,31,30,31,31,30,31,30,31],
  G:["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"],
  Z:["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"],
  An:["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"],
  st:["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"],
  n1:["日","一","二","三","四","五","六","七","八","九","十"],
  n2:["初","十","廿","卅"],
  n3:["正","二","三","四","五","六","七","八","九","十","冬","腊"],
  lYD:function(y){var s=348,i;for(i=0x8000;i>0x8;i>>=1)s+=((this.li[y-1900]&i)?1:0);return s+this.lD(y);},
  lM:function(y){return this.li[y-1900]&0xf;},
  lD:function(y){return this.lM(y)?((this.li[y-1900]&0x10000)?30:29):0;},
  mD:function(y,m){if(m>12||m<1)return -1;return(this.li[y-1900]&(0x10000>>m))?30:29;},
  GZ:function(o){return this.G[o%10]+this.Z[o%12];},
  gzY:function(y){var g=(y-3)%10,z=(y-3)%12;if(!g)g=10;if(!z)z=12;return this.G[g-1]+this.Z[z-1];},
  gT:function(y,n){
    // 节气日期：用天文近似公式计算
    if(y<1900||y>2100||n<1||n>24)return -1;
    var offs=[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
    var ms=Date.UTC(1900,0,6,2,5,0)+365.24219878*86400000*(y-1900)+offs[n-1]*60000;
    return new Date(ms).getUTCDate();
  },
  cM:function(m){return(m<1||m>12)?"":this.n3[m-1]+"月";},
  cD:function(d){switch(d){case 10:return"初十";case 20:return"二十";case 30:return"三十";}return this.n2[Math.floor(d/10)]+this.n1[d%10];},
  ast:function(m,d){var s="摩羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯";var a=[20,19,21,21,21,22,23,23,23,23,22,22];return s.substr(m*2-(d<a[m-1]?2:0),2)+"座";},
  s2l:function(Y,M,D){
    var y=+Y,m=+M,d=+D;
    if(y<1900||y>2100)return null;
    var obj=new Date(y,m-1,d);
    y=obj.getFullYear();m=obj.getMonth()+1;d=obj.getDate();
    var off=Math.round((Date.UTC(y,m-1,d)-Date.UTC(1900,0,31))/86400000);
    var i,tmp=0;
    for(i=1900;i<2101&&off>0;i++){tmp=this.lYD(i);off-=tmp;}
    if(off<0){off+=tmp;i--;}
    var yr=i,lp=this.lM(i),il=false;
    for(i=1;i<13&&off>0;i++){
      if(lp>0&&i===(lp+1)&&!il){--i;il=true;tmp=this.lD(yr);}
      else tmp=this.mD(yr,i);
      if(il&&i===(lp+1))il=false;
      off-=tmp;
    }
    if(off===0&&lp>0&&i===lp+1){if(il)il=false;else{il=true;--i;}}
    if(off<0){off+=tmp;--i;}
    var mo=i,dy=off+1;
    var gY=this.gzY(yr);
    var gM=this.GZ((y-1900)*12+m+11);
    var gD=this.GZ(Math.floor(Date.UTC(y,m-1,1)/86400000)+25567+10+d-1);
    return{lY:yr,lM:mo,lD:dy,ani:this.An[(yr-4)%12],
      iMon:(il?"闰":"")+this.cM(mo),iDay:this.cD(dy),
      cY:y,cM:m,cD:d,gY:gY,gM:gM,gD:gD,
      wk:obj.getDay(),astro:this.ast(m,d)};
  },
  l2s:function(y,m,d){
    y=+y;m=+m;d=+d;
    var day=this.mD(y,m);
    var _d=day;
    if(y<1900||y>2100||d>_d||d<1)return null;
    var off=0;
    for(var i=1900;i<y;i++)off+=this.lYD(i);
    var lp=0,ia=false;
    for(var j=1;j<m;j++){lp=this.lM(y);if(!ia&&lp<=j&&lp>0){off+=this.lD(y);ia=true;}off+=this.mD(y,j);}
    var cal=new Date((off+d-31)*86400000+Date.UTC(1900,1,30));
    return this.s2l(cal.getUTCFullYear(),cal.getUTCMonth()+1,cal.getUTCDate());
  }
};

// ── 节日列表 ──────────────────────────────────────────
function ls(y,lm,ld){var r=C.l2s(y,lm,ld);return r?r.cY+"-"+r.cM+"-"+r.cD:null;}

function termList(year){
  // 节气月份固定，用近似日期
  var terms=[["小寒",1],["大寒",1],["立春",2],["雨水",2],["惊蛰",3],["春分",3],
    ["清明",4],["谷雨",4],["立夏",5],["小满",5],["芒种",6],["夏至",6],
    ["小暑",7],["大暑",7],["立秋",8],["处暑",8],["白露",9],["秋分",9],
    ["寒露",10],["霜降",10],["立冬",11],["小雪",11],["大雪",12],["冬至",12]];
  var out=[];
  for(var i=0;i<terms.length;i++){
    var d=C.gT(year,i+1);
    if(d>0)out.push([terms[i][0],fmtYMD(year,terms[i][1],d)]);
  }
  return out.sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}
function legalList(year){
  var qm=C.gT(year,7); // 清明
  return [["元旦",fmtYMD(year,1,1)],["春节",ls(year,1,1)],
    ["清明节",qm>0?fmtYMD(year,4,qm):null],["劳动节",fmtYMD(year,5,1)],
    ["端午节",ls(year,5,5)],["中秋节",ls(year,8,15)],["国庆节",fmtYMD(year,10,1)]
  ].filter(function(x){return x[1];}).sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}
function folkList(year){
  var d12=C.mD(year,12);
  return [["除夕",ls(year,12,d12===29?29:30)],["元宵节",ls(year,1,15)],
    ["龙抬头",ls(year,2,2)],["七夕节",ls(year,7,7)],["中元节",ls(year,7,15)],
    ["重阳节",ls(year,9,9)],["腊八节",ls(year,12,8)],["小年(北)",ls(year,12,23)]
  ].filter(function(x){return x[1];}).sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}
function intlList(year){
  return [["情人节",fmtYMD(year,2,14)],["母亲节",nthWeekday(year,5,0,2)],
    ["父亲节",nthWeekday(year,6,0,3)],["万圣节",fmtYMD(year,10,31)],
    ["平安夜",fmtYMD(year,12,24)],["圣诞节",fmtYMD(year,12,25)],
    ["感恩节",nthWeekday(year,11,4,4)]
  ].sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}

function top3(all, today){
  var fut=all.filter(function(x){return dateDiff(today,x[1])>=0;});
  var take=fut.slice(0,3);
  var i=0;
  while(take.length<3&&i<all.length)take.push(all[i++]);
  return take.slice(0,3);
}

// ── 样式（与油价小组件统一） ──────────────────────────
var S = {
  bgLight: ['#F6F1E8', '#EADFC9'],
  bgDark: ['#2A2A2C', '#17171A'],
  gold: '#FFB340',
  text: { light: '#2B2118', dark: '#F5EFE4' },
  dim: { light: '#8A7B63', dark: '#9A8C78' },
  glass: { light: '#FFFFFFCC', dark: '#3A3A3CCC' },
  legal: { light: '#FF453A', dark: '#FF7A7A' },
  term:  { light: '#1E9E62', dark: '#50E3A4' },
  folk:  '#FFB340',
  intl:  { light: '#0A84FF', dark: '#79BBFF' },
  sep:   { light: '#2B21181F', dark: '#F5EFE41F' },
};
function alpha(c, a){
  if(typeof c === 'string') return c + a;
  return { light: c.light + a, dark: c.dark + a };
}

// ── DSL 帮助函数（Hark） ──────────────────────────────
function T(text, sz, color, wt, extra){
  var el={type:"text",text:String(text),font:{size:sz,weight:wt||"regular"},color:color||S.text};
  if(extra)for(var k in extra)el[k]=extra[k];
  return el;
}
function IC(sym,sz,color){return{type:"icon",name:sym,size:sz,color:color};}
function SP(f){return f?{type:"spacer",flex:f}:{type:"spacer"};}
function row(children,opts){
  var el={type:"stack",direction:"row",alignItems:"center",children:children};
  if(opts)for(var k in opts)el[k]=opts[k];
  return el;
}
function col(children,opts){
  var el={type:"stack",direction:"column",alignItems:"start",children:children};
  if(opts)for(var k in opts)el[k]=opts[k];
  return el;
}
function bgRoot(){
  return {
    type:"stack",direction:"column",flex:1,
    padding:[11,11,11,11],borderRadius:22,
    background:{light:{type:"linear",colors:S.bgLight},dark:{type:"linear",colors:S.bgDark}},
    children:[],
  };
}

// ── 节日胶囊 ───
function chip(name, days, accent){
  var isToday = days===0;
  return row([
    T(name, 10, isToday?S.text:S.dim, isToday?"semibold":"regular"),
    T(isToday?"今天":days+"天", 10, isToday?accent:S.dim, isToday?"bold":"regular"),
  ],{
    gap:3,
    padding:[4,8,4,8],
    backgroundColor: isToday?alpha(accent,"2E"):S.glass,
    borderRadius:8,
  });
}

function badge(sfSym, label, accent){
  return row([
    IC(sfSym, 10, accent),
    T(label, 10, accent, "semibold"),
  ],{gap:3, padding:[4,8,4,8], backgroundColor:alpha(accent,"22"), borderRadius:8});
}

function festRow(sfSym, label, accent, items, ds){
  return row([
    badge(sfSym, label, accent),
    chip(items[0][0], ds[0], accent),
    chip(items[1][0], ds[1], accent),
    chip(items[2][0], ds[2], accent),
    SP(),
  ],{gap:5});
}

// ── 主函数 ────────────────────────────────────────────
function main(){
  var size = $widget.size;
  var now=new Date();
  var y=now.getFullYear(), ny=y+1;
  var today=y+"-"+(now.getMonth()+1)+"-"+now.getDate();

  var L=C.s2l(y,now.getMonth()+1,now.getDate());
  var wkCN=["日","一","二","三","四","五","六"][now.getDay()];

  var root = bgRoot();

  // 锁屏：只显示农历日期
  if(size==="accessoryCircular"){
    root.children=[SP(),T(L?L.iDay:"--",22,S.text,"bold"),SP()];
    return root;
  }
  if(size==="accessoryInline"){
    root.children=[row([IC("calendar",13,S.gold),T((now.getMonth()+1)+"-"+now.getDate()+" "+(L?L.iDay:""),13,S.text,"medium")],{gap:4})];
    return root;
  }
  if(size==="accessoryRectangular"){
    root.children=[
      row([IC("calendar",14,S.gold),T((now.getMonth()+1)+"月"+now.getDate()+"日",15,S.text,"bold")],{gap:5}),
      T(L?(L.iMon+L.iDay):"",20,S.gold,"bold"),
    ];
    return root;
  }

  // 头部
  var lunarDay  = L ? L.iDay  : "--";
  var lunarMon  = L ? L.iMon  : "--";
  var gzYr      = L ? L.gY+"年" : "";
  var gzLine    = L ? L.gM+"月 "+L.gD+"日 "+L.ani+"年" : "";
  var astro     = L ? L.astro : "";

  var headerLeft = col([
    T(lunarDay, 26, S.text, "bold"),
    row([
      T(lunarMon, 10, S.dim, "regular"),
      T("·", 10, S.dim, "regular"),
      T(gzYr, 10, S.dim, "regular"),
    ],{gap:3}),
  ],{gap:2});

  var headerRight = col([
    row([
      IC("calendar", 12, S.gold),
      T((now.getMonth()+1)+"月"+now.getDate()+"日", 15, S.text, "semibold"),
    ],{gap:4}),
    T("星期"+wkCN+"  "+astro, 10, S.dim, "regular"),
    T(gzLine, 9, S.dim, "regular"),
  ],{gap:2, alignItems:"end"});

  var header = row([headerLeft, SP(), headerRight],{alignItems:"center"});
  var divider = {type:"stack", height:1, backgroundColor:S.sep, children:[]};

  // small 只显示头部
  if(size==="small"){
    root.children=[header,SP()];
    return root;
  }

  // 四类节日倒计时
  var LEG=top3(legalList(y).concat(legalList(ny)),today);
  var TRM=top3(termList(y).concat(termList(ny)),today);
  var FOL=top3(folkList(y).concat(folkList(ny)),today);
  var INT=top3(intlList(y).concat(intlList(ny)),today);
  function dds(arr){return arr.map(function(x){return dateDiff(today,x[1]);});}

  root.children=[
    header,
    SP(), divider, SP(),
    festRow("flag.fill","法定",S.legal,LEG,dds(LEG)),
    SP(),
    festRow("leaf.fill","节气",S.term,TRM,dds(TRM)),
    SP(),
    festRow("moon.stars.fill","民俗",S.folk,FOL,dds(FOL)),
    SP(),
    festRow("globe.asia.australia.fill","国际",S.intl,INT,dds(INT)),
    SP(),
  ];
  return root;
}

try{
  $widget.setConfig(main());
}catch(e){
  $widget.setConfig({
    type:"stack",children:[{type:"text",text:"小日子加载失败",font:{size:13},color:S.text}],
  });
}
