;(function(deps, factory) {
  "use strict";
  if (typeof define === "function" && define.amd)
    define(deps, factory);
  else if (typeof module != "undefined" && typeof module.exports != "undefined")
    module.exports = factory.apply(undefined, deps.map(e => require(e)));
  else
    window["utils"] = factory.apply(undefined, deps.map(e => window[e]));
}(["fileSystem", "LittleCrawler", "zip", "zip-ext"], function(fileSystem, LittleCrawler, zip){
  "use strict"

  zip.workerScriptsPath = "lib/zip/";

  return {
    /*
    * 开启调试模式
    */
    DEBUG: true,

    sleep(timeout){
      return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
      });
    },

    /*
    * 判断对象的类型
    * null -> null
    * undefined -> undefined
    * [] -> array
    * {} -> object
    * '' -> string
    * 0.1 -> number
    * new Error() -> error
    * ()->{} -> function
    */
    type: LittleCrawler.type,

    /**
     * 安全的执行 eval
     * @param  {[type]} code [description]
     * @return {[type]}      [description]
     */
    eval(code){
      let evalCode = `
        'use strict'
        var window = {}, document = {}, self = {}, global = {}, location = {};
        ${code}`;
      return eval(evalCode);
    },

    /**
     * 输出log 信息
     * @param  {[type]} content       [description]
     * @param  {[type]} detailContent [description]
     * @return {[type]}               [description]
     */
    log(content, detailContent) {
      const msg = `[${(new Date()).toLocaleString()}] ${content}${detailContent ? `: ${detailContent}` : '' }`;
      console.log(msg);
    },
    error(content, detailContent) {
      const msg = `[${(new Date()).toLocaleString()}] ${content}${detailContent ? `: ${detailContent}` : '' }`;
      console.error(msg);
    },

    /**
     * AJAX GET
     * @param  {[type]} url      [description]
     * @param  {[type]} params   [description]
     * @param  {[type]} dataType [description]
     * @param  {[type]} options  [description]
     * @return {[type]}          [description]
     */
    get(url, params, dataType, headers={}, options){
      return LittleCrawler.ajax("GET", url, params, dataType, headers, options);
    },

    /**
     * AJAX 获取 JSON 格式
     * @param  {[type]} url    [description]
     * @param  {[type]} params [description]
     * @return {[type]}        [description]
     */
    getJSON(url, params){
      return this.get(url, params, "json");
    },

    /**
     * 从 URL 字符串中获取参数对象
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    getParamsFromURL(url){
      if(!url)return {};
      let i = url.indexOf("?");
      if(i < 0)return {};
      url = url.slice(i+1);
      const params = {};
      const pa = url.split("&");
      for(let j=0; j < pa.length; j++){
        const p = pa[j];
        i = p.indexOf("=");
        if(i < 0)
          params[p] = undefined;
        else{
          const key = p.slice(0, i);
          const value = p.slice(i+1);
          params[key] = value;
        }
      }
      return params;
    },

    /**
     * HTML 内容转换为 Text
     */
    // html2text(html){

    //   function replaceElement(html, element, replaceString){
    //     const pattern = `<${element}(?: [^>]*?)?>[\\s　]*([\\s\\S]*?)[\\s　]*</${element}>`;
    //     html = html.replace(new RegExp(pattern, 'gi'), replaceString);
    //     return html;
    //   };

    //   if(!html) return html;

    //   // 替换转义字符
    //   html = html.replace(/&nbsp;/gi, ' ');

    //   // 解决用双 <br> 标签换行的问题
    //   const temp = html.replace(/\s*(<br ?\/?>\s*){2,}/gi, '\n');
    //   if(temp.search(/\s*<br ?\/?>\s*/) >= 0)
    //     html = html.replace(/\s*<br ?\/?>\s*/gi, '\n');
    //   else
    //     html = temp;
    //   // 替换标签
    //   html = replaceElement(html, 'p', '$1\n');
    //   html = replaceElement(html, 'span', '$1');
    //   html = replaceElement(html, 'b', '$1');
    //   html = replaceElement(html, 'i', '$1');

    //   // 去掉所有标签
    //   html = html.replace(/<(\\w+)( [^>]*?)?>[\\s\\S]*?<\/$1>/gi, ''); // 双标签
    //   html = html.replace(/<\\w+([^>]*?)?>/gi, ''); // 单标签
    //   return html.trim();
    // },

    /**
     * 将大写数字转换为小写的
     * 注意：仅支持四位
     */
    lowerCaseNumbers(str){
      if(!str) return str;
      str.replace('两', '二');
      const nums = '一二三四五六七八九';
      const digit = '万千百十';
      return str.replace(/[零一二三四五六七八九十百千万]+/g,
        numStr => {
          if(numStr.match(/^[零一二三四五六七八九]+$/)) // 纯数字没有 十百千万
            return parseInt(Array.from(numStr).map(n => nums.indexOf(n) + 1).join('').replace('零', '0'));
          let result = new Array(5).fill(0); // 万千百十个
          let p = -1;
          let lastMatchDigit = 3;
          for(let i = 0; i < 4; i++){
            let j = numStr.indexOf(digit[i], p + 1);
            if(j < 0) continue;
            result[i] = p == j ? '1' : numStr.substring(j-1, j);
            lastMatchDigit = i;
            p = j;
          }
          // 最后一个
          let numPart = numStr.substring(p + 1);
          if(numPart){
            if(numPart[0] != "零") // 诸如 一千三 这种数字
              result[lastMatchDigit + 1] = numPart;
            else
              result[4] = numPart[1];
          }

          result = result.map(n => nums.indexOf(n) + 1)
          return parseInt(result.join(''));
        });
    },

    /**
     * 将 Object 类型转换为指定的类
     * @param  {Object} obj           [description]
     * @param  {Function} ClassFunction [description]
     * @return {[type]}               [description]
     */
    objectCast(obj, ClassFunction){
      if(!obj || !ClassFunction) return obj;

      const nc = new ClassFunction();
      Object.assign(nc, obj);
      return nc;
    },

    /**
     * 将数组中的每个成员的类型都转换为指定的类
     * @param  {Array} array         [description]
     * @param  {Function} ClassFunction [description]
     * @return {[type]}               [description]
     */
    arrayCast(array, ClassFunction){
      if(!array || !ClassFunction) return array;

      array.forEach((v, i, arr) => {
        const nc = new ClassFunction();
        Object.assign(nc, array[i]);
        arr[i] = nc;
      });
      return array;
    },

    /**
     * 从副列表中匹配（必须相等）查询主列表的元素的索引
     * @param  {[type]} listA         主列表
     * @param  {[type]} listB         被搜索列表
     * @param  {[type]} indexA        主列表中的匹配记录索引
     * @param  {[type]} equalFunction 判等函数
     * @return {[type]}               [description]
     */
    listMatch(listA, listB, indexA,
      equalFunction=(i1,i2)=>i1==i2, startIndexB=0){
      if(!listA || !listB) return -1;

      if(listA == listB) return indexA;

      // 比较前、后 n 个邻居
      function compareNeighbor(indexB, offset){
        const nia = indexA + offset;
        const nib = indexB + offset;
        let equal;
        if(nia < 0 || nia >= listA.length)
          // 如果 indexA 越界，则返回 2
          equal = 2;
        else if(nib < 0 || nib >= listB.length)
          // 如果 indexA 越界，则返回 1
          equal = 1;
        else
          // 如果两者相等，则返回 3
          // 如果不相等则返回 0
          equal = equalFunction(listA[nia], listB[nib]) ? 3 : 0;
        return equal;
      }

      // 提供最优结果
      // 最终从所有结果中选出一个最好的
      const itemA = listA[indexA];
      // 所有匹配的结果的索引集合
      const equalSet = listB.slice(startIndexB)
          .map((e,i) => equalFunction(e, itemA) ? i : -1).filter(e => e>=0);
      if(equalSet.length <= 0)
        return -1;

      const result = [];
      for(let i of equalSet){
        // 比对前邻和后邻是否相同
        const leftEqual = compareNeighbor(i, -1) + 0.5; // 前面的权重大
        const rightEqual = compareNeighbor(i, 1);
        const weight = leftEqual + rightEqual;
        if(weight == 6.5){
          // 前后两个邻居都相等
          return i;
        }
        else{
          result.push({
            index: i,
            weight: weight,
            distance: Math.abs(i-indexA)
          });
        }
      }

      // 没找到结果
      // 返回结果集合中的一个最优结果

      // 最优结果：权值最大，并且索引值最靠近 indexA

      // 返回权值最大的值的集合
      const maxWeight = Math.max(...result.map(e => e.weight));
      const maxWeightSet = result.filter(e => e.weight == maxWeight);

      if(maxWeightSet.length <= 1)
        return maxWeightSet[0].index;
      else{
        // 在最大权重中搜索离 indexA 最近的值
        const minDistance = Math.min(...result.map(e => e.distance));
        return maxWeightSet.find(e => e.distance == minDistance).index;
      }
    },

    /**
     * 通过判断记录上下两个邻居是否相同来判断当前记录是否符合要求
     * @param  {[type]} listA         主列表
     * @param  {[type]} listB         被搜索的列表
     * @param  {[type]} indexA        主列表中的匹配记录索引
     * @param  {[type]} equalFunction 判等函数
     * @return {[type]}               [description]
     */
    listMatchWithNeighbour(listA, listB, indexA, equalFunction=(i1, i2)=>i1==i2){

      if(!listA || !listB) return -1;

      if(listA == listB)
        return indexA;

      if(indexA < 0 || indexA >= listA.length || listB.length < 2 || listA.length < 2)
        return -1;

      let indexBLeft, indexBRight, itemBLeft, itemBRight;
      let indexALeft, indexARight, itemALeft, itemARight;

      indexALeft = indexA - 1;
      indexARight = indexA + 1;

      if(indexALeft < 0){
        // A 前面没有元素
        // 那就搜索后面的是否和头部匹配
        indexBRight = 1;
        itemARight = listA[indexARight];
        itemBRight = listB[indexBRight];
        return equalFunction(itemARight, itemBRight) ? indexBRight - 1 : -1;
      }

      if(indexARight >= listA.length){
        // A 到底部了
        // 那就搜索前面的是否和尾部匹配
        indexBLeft = listB.length - 2;
        itemALeft = listA[indexALeft];
        itemBLeft = listB[indexBLeft];
        return equalFunction(itemALeft, itemBLeft) ? indexBLeft + 1 : -1;
      }

      itemALeft = listA[indexALeft];
      itemARight = listA[indexARight];


      let startIndexB = 0;
      let i = -1;

      while(true)
      {
        i = listB.slice(startIndexB).findIndex(e => equalFunction(e, itemALeft));
        if(i < 0){
          // 没找到结果
          // 从前一个匹配不成功，表示listB 中没有匹配的前一个对象
          // 则只检查开头
          indexBRight = 1;
          itemBRight = listB[indexBRight];
          return equalFunction(itemARight, itemBRight) ? indexBRight - 1 : -1;
        }

        i += startIndexB;
        startIndexB = i + 1;

        // 找到结果，开始分析
        // 比较后面第二个是否相同
        indexBRight = i + 2;

        if(indexBRight >= listB.length){
          // B 到底部了，直接返回
          return (i + 1 < listB.length) ?  i + 1 : -1;
        }

        itemBRight = listB[indexBRight];
        if(equalFunction(itemARight, itemBRight)){
          return i + 1;
        }
      }
    },

    /**
     * 保存已经被 JSON.stringify 格式化后的字符串
     * @param  {[type]}  key       [description]
     * @param  {String}  data      [description]
     * @param  {Boolean} onlyCache 在缓存存储中操作，否则在永久存储中操作
     * @return {[type]}            [description]
     */
    saveTextData(key, data, onlyCache=false){
      if(!key || !data)
        return Promise.reject(new Error("Illegal args"));
      if(window.requestFileSystem){
        return fileSystem.saveTextToFile(key, data, onlyCache);
      }
      else{
        const s = onlyCache? sessionStorage : localStorage;
        s.setItem(key, data);
        return Promise.resolve();
      }
    },

    /**
     * 保存数据到指定键中
     * @param  {[type]}  key       [description]
     * @param  {Object}  data      [description]
     * @param  {Boolean} onlyCache 在缓存存储中操作，否则在永久存储中操作
     * @return {[type]}            [description]
     */
    saveData(key, data, onlyCache=false){
      if(!key || !data)
        return Promise.reject(new Error("Illegal args"));

      data = JSON.stringify(data);
      return this.saveTextData(key, data, onlyCache);
    },

    /**
     * 加载指定键的数据
     * @param  {[type]}  key       [description]
     * @param  {Boolean} onlyCache 在缓存存储中操作，否则在永久存储中操作
     * @return {[type]}            [description]
     */
    loadData(key, onlyCache=false){
      if(!key) return Promise.reject(new Error("Illegal args"));

      if(window.requestFileSystem)
        return fileSystem.loadTextFromFile(key, onlyCache)
          .then(data => JSON.parse(data));
      else{
        const s = onlyCache? sessionStorage : localStorage;
        let data = s.getItem(key);
        data = JSON.parse(data);
        return Promise.resolve(data);
      }
    },

    /**
     * 删除制定键的数据
     * 如果键的末尾是 /，则删除以该键开头的所有键，该操作用于删除目录
     * @param  {[type]}  key       [description]
     * @param  {Boolean} onlyCache 在缓存存储中操作，否则在永久存储中操作
     * @return {[type]}            [description]
     */
    removeData(key, onlyCache=false){
      if(!key) return Promise.reject(new Error("Illegal args"));

      if(window.requestFileSystem){
        return fileSystem.removePath(key, onlyCache);
      }
      else{
        const s = onlyCache? sessionStorage : localStorage;
        if(key[key.length - 1] == "/"){
          let pattern = new RegExp(`^${key}`);
          for(let k in s)
            if(k.match(pattern))
              delete s[k];
        }
        else
          s.removeItem(key);
        return Promise.resolve();
      }
    },

    /**
     * 指定键的数据是否存在
     * @param  {String}  key       [description]
     * @param  {Boolean} onlyCache 在缓存存储中操作，否则在永久存储中操作
     * @return {[type]}            [description]
     */
    dataExists(key, onlyCache=false){
      if(window.requestFileSystem){
        return fileSystem.fileExists(key, onlyCache);
      }
      else{
        const s = onlyCache? sessionStorage : localStorage;
        return Promise.resolve(key in s);
      }
    },

    /**
     * 在一个错误数组中找出数量最多的那个错误
     * @param  {[type]} errorList [description]
     * @return {[type]}           [description]
     */
    findMostError(errorList){

      if(!errorList) return errorList;

      let el = errorList.map(e => typeof e == 'string' || typeof e == 'number' ? new Error(e) : e);
      const counter = {};
      el.forEach(m => {
        let k = m.message;
        if(!(k in counter))
          counter[k] = 1;
        else
          counter[k] += 1;
      });

      let maxKey;
      for(let k in counter)
        if(!maxKey || counter[k] > counter[maxKey])
          maxKey = k;

      return errorList.find(e => {
        switch(typeof e){
          case "string":
            return e == maxKey;
          case "number":
            return e.toString() == maxKey;
          case "object":
            return e.message == maxKey;
          default:
            return e == maxKey;
        }
      });
    },

    // 给数组计数
    // arrayCount(array){
    //   if(!array) return array;
    //   const counter = new Map();
    //   array.forEach(m => {
    //     if(!counter.has(m))
    //       counter.set(m, 1);
    //     else
    //       counter.set(m, counter.get(m) + 1);
    //   });
    //   const result = [];
    //   for(let k in counter){
    //     result.push([k, counter[k]])
    //   }
    //   result.sort((e1,e2) => e2[1] - e1[1]);
    //   return result;
    // },

    /**
     * 添加事件监听机制
     * 支持 addEventListener、fireEvent、removeEventListener 等
     * @param {[type]} obj [description]
     */
    addEventSupport(obj){
      obj.__events = {};
      obj.addEventListener = addEventListener.bind(obj);
      obj.fireEvent = fireEvent.bind(obj);
      obj.removeEventListener = removeEventListener.bind(obj);

      function addEventListener(eventName, handler, runonce=false){
        if(!eventName || !handler) return;
        if(!(eventName in this.__events))
          this.__events[eventName] = [];
        this.__events[eventName].push({handler: handler, runonce: runonce});
      }

      function fireEvent(eventName, e={}){
        if(!eventName) return;

        // init e

        if(!("currentTarget" in e)) e.currentTarget = this;
        if(!("target" in e)) e.target = this;
        e.stopPropagation = () => { e.__stopPropagation = true;};

        // __onEvent
        // let __onevent = `__on${eventName[0].toUpperCase()}${eventName.substring(1)}`;
        // if(__onevent in this){
        //   try{
        //     this[__onevent](e);
        //   }
        //   catch(error){
        //     console.error(error);
        //   }
        // }

        // addEventListener
        if(eventName in this.__events){
          let removeList = [];
          let handlers = this.__events[eventName];
          for(let eh of handlers){
            if(!eh) continue;
            try{
              if(e.__stopPropagation) break;
              if(eh.runonce)
                removeList.push(eh);
              eh.handler(e);
            }
            catch(error){
              console.error(error);
            }
          }
          removeList.forEach(e => handlers.splice(handlers.indexOf(e), 1));
        }

        // onEvent
        let onevent = `on${eventName[0].toUpperCase()}${eventName.substring(1)}`;
        if(onevent in this){
          try{
            this[onevent](e);
          }
          catch(error){
            console.error(error);
          }
        }
      }

      function removeEventListener(eventName, handler){
        if(!eventName || !handler) return;
        if(eventName in this.__events){
          let i = this.__events[eventName].findIndex(m => m.handler == handler);
          if(i >= 0)
            this.__events[eventName].splice(i, 1);
        }
      }
    },

    /**
     * 将对象持久化
     * 可在对象的 persistentInclude 字段中指定要持久化的字段列表
     * @param  {[type]} o [description]
     * @return {[type]}   [description]
     */
    persistent(o){
      function __persistent(obj){
        // undefined
        // null
        // boolean
        // string
        // number
        // object: array
        // symbol
        switch(typeof(obj)){
          case "object":
            if(Array.prototype.isPrototypeOf(obj))
            {
              let children = [];
              for(let v of obj){
                let value = __persistent(v);
                if(value !== undefined)
                  children.push(value);
              }
              return '[' + children.join(",") + ']';
            }
            else if(obj == null){
              return "null";
            }
            else{

              let persistentInclude = obj.constructor.persistentInclude;
              let keys = null;
              if(persistentInclude != undefined && Array.prototype.isPrototypeOf(persistentInclude)){
                keys = persistentInclude;
              }
              else
                keys = Object.getOwnPropertyNames(obj);

              let children = [];
              for(let k of keys){
                let value = __persistent(obj[k]);
                if(value !== undefined)
                  children.push(`"${k}":${value}`);
              }
              return '{' + children.join(",") + '}';
            }
            break;

          case "function":
            return undefined;
          case "number":
            return obj;
          case "undefined":
            return undefined;
          case "boolean":
            return obj;
          default:
            return JSON.stringify(obj);
        }
      }
      return __persistent(o);
    },

    /**
     * 判断点是否在区域内
     * @param  {Rect}  rect  [description]
     * @param  {Point}  point [description]
     * @return {Boolean}       [description]
     */
    isPointInRect(rect, point){
      if(!point || !rect) return false;
      let x = point.x || point.X;
      let y = point.y || point.Y;

      if(y > rect.top && y < rect.bottom && x > rect.left && x < rect.right)
        return true;
      return false;
    },

    /**
     * 获取数据的箱图
     * @param  {Array} data [description]
     * @return {Boxpolt}      [description]
     */
    getBoxPlot(data){
      let Q1, Q2, Q3;
      data = Object.assign([], data);
      data = data.sort((e1, e2) => e1 - e2);
      let len = data.length;

      Q1 = data[Math.ceil(len * 0.25) - 1];
      Q2 = data[Math.ceil(len * 0.5) - 1];
      Q3 = data[Math.ceil(len * 0.75) - 1];
      return {
        Q1: Q1,
        Q2: Q2,
        Q3: Q3,
        Q0: Q1 - 1.5 * (Q3 - Q1),
        Q4: Q3 + 1.5 * (Q3 - Q1),
      };
    },

    /**
     * 将字符串中的全角字符转换为半角字符
     */
    DBCtoCDB(str)
    {
      let whiteList = "，。！“”《》？（）‘’：；·~……";
      return Array.from(str)
        .map(e => {
          let code = e.charCodeAt(0);
          if (whiteList.indexOf(e) < 0 && code > 65248 && code < 65375)
            return String.fromCharCode(code - 65248);
          else
            return e;
        })
        .join("");
    },

    /**
     * 获取压缩文件中的数据
     * @param  {ArrayBuffer} arrayBuffer 数据
     * @param  {Number} entryIndex  指定文件列表中想要获取记录的索引
     * @return {[type]}             [description]
     */
    getDataFromZipFile(arrayBuffer, entryIndex = 0){
      return new Promise((resolve, reject) => {
        // zip.workerScriptsPath = "lib/zip/";
        zip.createReader(new zip.ArrayBufferReader(arrayBuffer), zipReader => {
          zipReader.getEntries(entries => {
            entries[entryIndex].getData(new zip.ArrayBufferWriter(), data => {
              zipReader.close();
              resolve(data);
            });
          });
        }, reject);
      });
    },

    /**
     * 获取 GUID 值
     * @param  {Number} scale 使用的进制，默认是32进制，节省空间
     * @return {[type]}       [description]
     */
    getGUID(scale=32){
      return new Date().getTime().toString(scale) + (Math.random() * 10000).toFixed().toString(scale);
    },

    Random: {
      /**
       * 生成随机整数
       * @param  {int} ceil  上界(不包含)
       * @param  {int} floor 下界(包含)
       * @return {int}       [description]
       */
      randomInt(ceil, floor){
        if(floor == undefined)
          floor = 0;
        if(ceil == undefined)
          ceil = floor;
        return Number.parseInt((ceil - floor) * Math.random() + floor);
      },

      /**
       * 从数组中随机选择一个元素
       * @param  {Array} array [description]
       * @param  {[type]} from  起始
       * @param  {[type]} to    终止（不包含该索引）
       * @return {[type]}       [description]
       */
      choice(array, from=0, to){
        if(!array)
          return null;
        if(to == undefined)
          to = array.length;
        return array[this.randomInt(to, from)];
      }
    }

  };

}));
