var cloud_name = 'closeapp';
var preset_name = 'pdb2hd9j';

this.js = this.js || {};
function App() {

    var p;
    p = this;
    this.super_constructor();


    App.prototype.initialize = function () {
        p.mainData = mainData;
        p.mainAssets = mainAssets;
        p.first = true;
        p.fromEdit = false;
        p.hasLogo = false;
        p.bitmapBefore = null;
        p.bitmapAfter = null;
        p.bitmapLogo = null;
        p.signature_obj = {};
        p.breaks_obj = {};
        p.theWallReady = false;
        p.nowBrick = null;
        p.setNewUser = false;
        
        p.sendObj = null;
       
        window.onbeforeunload = closingCode;
        function closingCode() {
            p.clearBrick();
            return null;
        }

        STYLE = mainAssets.baseStyle;

        js.helper.DisplayObjectFromJson.buildView([p.mainAssets.gameView.connectPopup], stage);
       
        stage.connectPopup.bgRectRed.animate({ props: { scaleY: 0 }, rewind: true, loop: true })

        var progressBar = new ProgressBar({ barType: "rectangle", foregroundColor: "#ffcb31", borderColor: "#ffcb31" });
        var loadImageAndSoundFirst = frame.loadAssets({ assets: assets, progress: progressBar, path: path });
        var loadImageAndSoundFirst1 = loadImageAndSoundFirst.on("complete", function () {

            js.helper.DisplayObjectFromJson.buildView(p.mainAssets.fullFrame, stage);
            js.helper.DisplayObjectFromJson.buildView(p.mainAssets.fridge, stage);

            p.fridgeCon = stage.fridgeCon;
            //  p.wallAnimate.wall_mc.y = 400;
          
            p.fridgeCon.topRect.visible = false;
            p.fridgeCon.bottomRect.visible = false;

            stage.connectPopup.top();
            if(queryString.isLocal!="true")
            {
                p.initializeFireBase();
            }else{
                p.startView();
            }


           
            stage.update(); // this is needed to show any changes
        });

    }

    App.prototype.startView = function (showEdit) {

        if(stage.connectPopup) stage.connectPopup.dispose();
        var tempCon = new Container();
        var arr = [];
        var colors = ["#F8E9DC","#F2E6DF","#D5E5E3","#EFE7F3","#DBF2EE","#E4EEDC","#DDE8FA"
                        ,"#F5D4D4","#FCF6DA","#E5E6FA","#F9E5C7"]
        var words = asset("words.json").words;
        var colorFun = Pick.series(colors);
        loop(words,function(wordObj,i){
            
            js.helper.DisplayObjectFromJson.buildView(p.mainAssets.magnet, tempCon);
           
            var magnetCon = tempCon.magnetCon;
            magnetCon.coundId = i;
            magnetCon.label.text = wordObj.text;
            magnetCon.bgRect.color = colorFun();
            magnetCon.bgRect.widthOnly = magnetCon.label.width*1.2;
            magnetCon.drag({all:true});
            arr.push(magnetCon);
            magnetCon.on("mousedown",function(){
                
                
                magnetCon.addTo(stage);
                magnetCon.stagemouseupEvent = stage.on("stagemouseup",function(){
                    stage.off("stagemouseup",magnetCon.stagemouseupEvent);
                    if(magnetCon.hitTestBounds(p.fridgeCon.topRect))
                    {
                        magnetCon.startObj.isTop = true;
                        magnetCon.startObj.newX = magnetCon.x;
                        magnetCon.startObj.newY = magnetCon.y;
                        p.itemPlaceObj[magnetCon.coundId] =  magnetCon.startObj;
                        
                    }else{
                        magnetCon.startObj.isTop = false;
                        magnetCon.addTo(magnetCon.startParent);
                        p.itemPlaceObj[magnetCon.coundId] =  magnetCon.startObj;
                        magnetCon.loc(magnetCon.startObj.x,magnetCon.startObj.y);
                    }
                    p.updateSendObj();
                })
            })
        });

        var conWrapper = new Container();
        var wrapper = new Wrapper({
            items: arr,
            width:470,
            spacingH:15,
            spacingV:20,
            valign: "center",
            align: "left"
            }
        )
        wrapper.addTo(conWrapper).mov(0,20);
        var rectForDrag = new Rectangle(conWrapper.width,conWrapper.height+40,"rgba(0,0,0,0.01)");
        rectForDrag.addTo(conWrapper,0);
       // wrapper.center().mov(0,70);
        stage.update();
        
        p.itemPlaceObj = {};
        p.itemsObj = {};
        loop(arr,function(magnetCon){
            if(magnetCon.startObj==undefined)
                {
                    magnetCon.startParent = magnetCon.parent;
                    magnetCon.startObj = {x:magnetCon.x,y:magnetCon.y,rotation:magnetCon.rotation,coundId:magnetCon.coundId};
                    p.itemPlaceObj[magnetCon.coundId] =  magnetCon.startObj;
                    p.itemsObj[magnetCon.coundId] =  magnetCon;
                }
        })
        
        

        var arrSlice = wrapper.items2D;
      //  wrapper.remove(wrapper.items)

       /* var arrNow = [];
        loop(arrSlice.slice(0,12),function(item_arr){
            loop(item_arr,function(item){
                arrNow.push(item)
            });
        })
        wrapper.add(arrNow);
        wrapper.pos(-20,40,CENTER,BOTTOM)*/
       // 

       var win = new Window({
            backgroundColor:"rgba(0,0,0,0.01)",
            width:p.fridgeCon.bottomRect.width+20,
            height:p.fridgeCon.bottomRect.height,
            interactive:true,
            padding:0,
            slideDamp:.2
        });
        win.add(conWrapper);
        win.loc(p.fridgeCon.bottomRect.x-p.fridgeCon.bottomRect.width/2,p.fridgeCon.bottomRect.y-p.fridgeCon.bottomRect.height/2)

        if(queryString.isLocal!="true")
        {
            if(p.sendObj==undefined)
            {
                p.sendObj = p.itemPlaceObj;
            }else{
               
                p.itemPlaceObj = p.sendObj;
                p.updateStatus();
            }
            p.updateSendObj();
        }else{
            
        }
    };

    App.prototype.haveData = function (snap) {
        p.snap = snap;

        snap.ref('/.info/serverTimeOffset')
        .once('value')
        .then(function stv(data) {
            finalLocalTime = new Date().getTime();
            var offset = data.val();
            var estimatedServerTimeMs = new Date().getTime() + offset;
           /* console.log(firebase.database.ServerValue);
            console.log(estimatedServerTimeMs);
            console.log(finalLocalTime);*/
        }, function (err) {
            return err;
        });

      

        if (p.first) {
            p.first = false;
            var queryString = getQueryString();
            p.queryString = queryString;
            if (queryString == undefined) queryString = {};
            queryString.id = "-MjWCifIy0O_22C1JBEd";
            if (queryString.id != undefined) {
                //                var playerObj = snap.child("magneticPoetry").val();
                var playerObj = snap.ref("magneticPoetry/" + queryString.id);
                p.playerObj = playerObj;


                p.likeRef = playerObj.child("likeObj");
                p.likeRef.on("value", function (greetingRef) {
                    var allSignature = greetingRef.val();
                 //   p.sendObj =allSignature;
                    p.itemPlaceObj = allSignature.sendObj;
                   // debugger
                    p.updateStatus();
                    
                });
                //var nowKeyObj = playerObj[queryString.id];
                p.playerEventStart = playerObj.on("value", function (greetingRef) {
                    var nowKeyObj = greetingRef.val();
                    playerObj.off("value", p.playerEventStart);
                    
                    if(nowKeyObj.likeObj)
                    {
                        p.sendObj = nowKeyObj.likeObj.sendObj;
                    }
                    
                    p.startView();

                });
            } else {
               // debugger
                p.showOpenGroup();
            }

        }

        // p.startView();
    }


    App.prototype.updateSendObj = function () {
        if (p.playerObj != undefined) {

 
            result = p.likeRef.update({sendObj:p.itemPlaceObj});;
            result.then(function () {
                zog("send save");
                
                
                ////	console.log("great", key);
            }).catch(function (error) {
                console.log("bad", error);
            })
            p.nowBrick = null;
            return
        }
    }

    App.prototype.saveSignature = function () {

        if (p.playerObj != undefined) {

            //let obj  =likeRef.ref().database();
            //get all user

            result = p.likeRef.push({ "brickId": p.nowBrick.nameForDB, "textOnBrick": p.nowBrick.textInto_txt.text, status: "full"/*, "name":p.signatureNameText,"city":p.signatureCityText*/ });
            result.then(function () {
                zog("send save");
                
                // p.smallButtons.signature_btn.visible = false;
                stage.update();
                var queryString = getQueryString();

                var objCookie = 0;
                if(p.queryString)
                {
                    objCookie = getCookie("createCount"+p.queryString.id);
                }
                if(objCookie==undefined)
                {
                    objCookie = 0;
                }
                var countNext = ""+(+objCookie+1);
                setCookie("createCount"+queryString.id, countNext, 1);
                // p.sendImageToServer();
                //p.isLoad();
                ////	console.log("great", key);
            }).catch(function (error) {
                console.log("bad", error);
            })
            p.nowBrick = null;
            return
        }

    }

   



    App.prototype.updateStatus = function () {
        if(p.itemsObj && p.itemPlaceObj)
        {
            loop(p.itemsObj,function(itemName,magnetCon){
                //debugger
                if(p.itemPlaceObj[magnetCon.coundId].isTop)
                {
                    magnetCon.addTo();
                    magnetCon.loc(p.itemPlaceObj[magnetCon.coundId].newX,p.itemPlaceObj[magnetCon.coundId].newY);
                    
                }else{
                    magnetCon.addTo(magnetCon.startParent);
                    magnetCon.loc(p.itemPlaceObj[magnetCon.coundId].x,p.itemPlaceObj[magnetCon.coundId].y);
                }
            })
        }
        stage.update();
    }

    App.prototype.showOpenGroup = function () {
        var p = this;
        const steps = [
            {
                number: 0,
                input: 'text',
                inputValue: p.groupNameText ? p.groupNameText : '',
                title: 'שם קבוצה',
                text: 'השם של הקבוצה שלכם',
                inputAttributes: { 'aria-label': "" }
            },
            {
                number: 1,
                input: 'text',
                inputValue: p.fromText ? p.fromText : '',

                title: 'שם מוסד?',
                text: 'שם בית הספר',
                inputAttributes: { 'aria-label': "" }

            }

        ];
        const swalQueueStep = Swal.mixin({
            confirmButtonText: 'הבא',
            reverseButtons: true,
            cancelButtonText: 'הקודם',
            confirmButtonColor: "#2B2C69",
            validationMessage: 'חובה למלא את השדה',
            progressSteps: steps,

            input: 'text',
            allowEscapeKey: false,
            allowOutsideClick: false,
            reverseButtons: true,
            inputAttributes: {
                required: true
            },
            reverseButtons: true,
            validationMessage: 'This field is required'
        });

        async function backAndForth() {
            const values = [p.groupNameText, p.fromText];
            let currentStep

            for (currentStep = 0; currentStep < steps.length;) {
                const result = await swalQueueStep.fire({
                    title: steps[currentStep].title,
                    input: steps[currentStep].input,
                    progressStepsDistance: "50px",
                    inputAttributes: steps[currentStep].inputAttributes,
                    inputValue: values[currentStep] ? values[currentStep] : '',
                    showCancelButton: currentStep > 0,

                    progressSteps: ["1", "2"],
                    inputPlaceholder: steps[currentStep].inputPlaceholder ? steps[currentStep].inputPlaceholder : '',
                    text: steps[currentStep].text,
                    currentProgressStep: steps[currentStep].number
                })

                if (result.value) {
                    values[currentStep] = result.value;
                    currentStep++;
                } else if (result.dismiss === 'cancel') {
                    currentStep--;
                } else {
                    break
                }
            }

            if (currentStep === steps.length) {
                //Swal.fire(JSON.stringify(values))

                p.groupNameText = values[0];
                p.fromText = values[1];

                p.makeNewUser();
                stage.update();
            }
        }


        backAndForth()


        return


    }

    App.prototype.makeNewUser = function () {
        var names = firebase.database().ref("magneticPoetry");
        var key = names.push().key;
        var update = {};
        if(p.sendObj==undefined) p.sendObj={};
        update[key] = { "date": new Date(), "key": key, "sendObj": p.sendObj };
        var result = names.update(update);
        result.then(function () {
            p.nowKey = key;
            // p.sendImageToServer();
            p.fromEdit = false;

            p.isLoad();
            
            if (p.setNewUser) {
                loop(p.brick_arr, function (brick) {
                    brick.status = "";
                    brick.mouse();
                    brick.cur();
                    brick.textInto_txt.text = "";
                });
                p.signature_obj = {};
                p.first = true;
                p.haveData(p.snap);
                p.setNewUser = false;
                p.clearBrick();
            }
            ////	console.log("great", key);

            stage.update();
        }).catch(function (error) {
            console.log("bad", error);
        })
    }

    App.prototype.removeAll = function () {

    }


    App.prototype.getPassword = function (e) {
        Swal.fire({
            title: p.mainAssets.managerSetting.texts.enterPassword,
            input: 'password',
            inputAttributes: {
                autocapitalize: 'off'
            },

            allowEscapeKey: false,
            allowOutsideClick: false,

            showCancelButton: true,
            reverseButtons: p.mainAssets.managerSetting.texts.reverseButtons,
            confirmButtonText: p.mainAssets.managerSetting.texts.confirmButtonText,
            cancelButtonText: p.mainAssets.managerSetting.texts.cancelButtonText,
        }).then((result) => {
            if (result.value == p.mainAssets.managerSetting.texts.password) {
                p.setNewUser = true;
                p.showOpenGroup();
            }else{
                Swal.fire(
                    {
                        icon: 'warning',
                        title: p.mainAssets.managerSetting.texts.notRightPassword
                    });
            }
        })
    }

    App.prototype.signature = function () {
        var p = this;
        //p.saveSignature();
        //return;

        var p = this;
        const steps = [
            {
                number: 0,
                input: 'text',
                inputValue: p.signatureNameText ? p.signatureNameText : '',
                title: 'השם שלכם',
                text: 'השם המלא שלכם שיופיע בעצומה',
                inputAttributes: { 'aria-label': "" }
            },

            {
                number: 1,
                inputValue: p.signatureCityText ? p.signatureCityText : '',
                input: 'text',
                text: "הקלידו את מקום המגורים",
                title: 'מהיכן אתם'
            }


        ];

        const swalQueueStep = Swal.mixin({
            confirmButtonText: 'הבא',
            reverseButtons: true,
            cancelButtonText: 'הקודם',
            confirmButtonColor: "#2B2C69",
            validationMessage: 'חובה למלא את השדה',
            progressSteps: steps,

            input: 'text',
            allowEscapeKey: true,
            allowOutsideClick: true,
            reverseButtons: true,
            inputAttributes: {
                required: true
            },
            reverseButtons: true,
            validationMessage: 'This field is required'
        });

        async function backAndForth() {
            const values = [p.groupNameText, p.fromText, p.fullText];
            let currentStep

            for (currentStep = 0; currentStep < steps.length;) {
                const result = await swalQueueStep.fire({
                    title: steps[currentStep].title,
                    input: steps[currentStep].input,
                    progressStepsDistance: "50px",
                    inputAttributes: steps[currentStep].inputAttributes,
                    inputValue: values[currentStep] ? values[currentStep] : '',
                    showCancelButton: currentStep > 0,

                    progressSteps: ["1", "2"],
                    inputPlaceholder: steps[currentStep].inputPlaceholder ? steps[currentStep].inputPlaceholder : '',
                    text: steps[currentStep].text,
                    currentProgressStep: steps[currentStep].number
                })

                if (result.value) {
                    values[currentStep] = result.value;
                    currentStep++;
                } else if (result.dismiss === 'cancel') {
                    currentStep--;
                } else {
                    break
                }
            }

            if (currentStep === steps.length) {
                //Swal.fire(JSON.stringify(values))

                p.signatureNameText = values[0];
                p.signatureCityText = values[1];

                p.saveSignature();
                stage.update();
            }
        }

        backAndForth()


        return



    }


    App.prototype.ChangeUrl = function (page, url) {

        if (typeof (history.pushState) != "undefined") {
            var obj = { Page: page, Url: url };
            history.pushState(obj, obj.Page, obj.Url);
        } else {
            window.location.href = "http://closeapp.co.il/apps/greeting/roshHashana/";
            // alert("Browser does not support HTML5.");
        }
    }


    App.prototype.isLoad = function () {
        var s = location.href;
        var addChar = "?";
        queryString.id = p.nowKey;



        var str = Object
            .keys(queryString)
            .map(k => k + '=' + queryString[k])
            .join('&');

        str = "?" + str;
        p.ChangeUrl(str, str);



        var currentLocation = window.location.href;

        p.showShareButton();
        //showSwal({ shareText: ' הברכה מוכנה, כעת ניתן לשלוח אותה ולשתף לחברים, העתיקו את הכתובת והדביקו בשביל לשתף ' + "\n" + currentLocation })


    }

    App.prototype.showShareButton = function () {

        
       // p.smallButtons.share_btn.visible = true;
       // p.smallButtons.signature_count.visible = true;
       // p.smallButtons.signature_btn.theText.text = p.smallButtons.signature_btn.theText.StartText;

        var currentLocation = window.location.href;
                var shareText = ' בואו לחתום על העצומה שלי! ';
                if (p.mainAssets.gameView.texts) {
                    shareText = p.mainAssets.gameView.texts.shareText;
                }
                showSwal({ shareText: shareText + "\n" + currentLocation })

        stage.update();

        // p.createNewButton.addTo(stage)
    }


    App.prototype.initializeFireBase = function () {
        // Initialize Firebase

        var config = {
            apiKey: "AIzaSyCBtZZH_hvPvEkUptWGQMn1AmVGTUBOZqY",
            authDomain: "greeting-512b8.firebaseapp.com",
            databaseURL: "https://greeting-512b8.firebaseio.com",
            projectId: "greeting-512b8",
            storageBucket: "greeting-512b8.appspot.com",
            messagingSenderId: "61543385280",
            appId: "1:61543385280:web:9cff0e108ab066972e0525"
        }

        firebase.initializeApp(config);

        var dbRef = firebase.database();
        p.haveData(dbRef);

        

    }




    this.initialize();

}

js.App = App;
zim.extend(js.App, zim.Container);


function showSwal(obj) {
    var currentLocation = window.location.href;
    var shareText
    var shareTheGameTitle = "שתפו את המשחק :)";
    var cancelButtonText = 'שיתפתי!';
    var confirmButtonText = 'העתקת קישור';
    var titleAfterCopy = 'הקישור הועתק';
    var textAfterCopy = "שתפו את הקישור :)";

    if (mainAssets.gameView.texts) {
        shareTheGameTitle = mainAssets.gameView.texts.shareTheGameTitle;
        cancelButtonText = mainAssets.gameView.texts.cancelButtonText;
        confirmButtonText = mainAssets.gameView.texts.confirmButtonText;
        titleAfterCopy = mainAssets.gameView.texts.titleAfterCopy;
        textAfterCopy = mainAssets.gameView.texts.textAfterCopy;

    }
    if (obj) {
        shareText = obj.shareText;
    }
    nowText = shareText;
    zog("currentLocation", currentLocation)
    var html = "" + "<a href='https://www.facebook.com/sharer/sharer.php?u=" + currentLocation + "&quote" + shareText + "' target='_blank'><img src='assets/facebook.png'></a><span>   </span>";
    html += "<a href=' https://api.whatsapp.com/send?text=" + encodeURIComponent(shareText) + "' target='_blank'><img src='assets/whatsapp.png'></a><span>   </span>";
    html += "<a onclick=tweetCurrentPage()><img src='assets/twitter.png'></a><span>   </span>";
    html += "<br><input  cols='40' rows='5' id='theCopyElement' type='text' value='" + shareText + "'></input><span>   </span>";


    Swal.fire({
        /*title: 'איזה כיף!',*/
        title: shareTheGameTitle,
        html: html,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#7100d1',
        cancelButtonText: cancelButtonText,
        confirmButtonText: confirmButtonText,
        confirmButtonAriaLabel: 'Thumbs up, great!',
    }).then((result) => {
        if (result.value) {
            copyFunction("theCopyElement");
            Swal.fire({
                title: titleAfterCopy,
                text: textAfterCopy,
            });
        }
    })

}


function tweetCurrentPage() {
    window.open(
        "https://twitter.com/share?url=" + window.location.href
        + "&text=" + nowText +
        + "&hashtags=musiclick"
        ,
        'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600'
    );
    return false;
}

function copyFunction(theCopyElement) {
    /* Get the text field */
    var copyText = document.getElementById(theCopyElement);

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

}