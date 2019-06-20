// 该文件封装Cesium.Viewer基本操作并保证单实例
import Cesium from 'cesium/Cesium'
import globalconfig from '../../common/buss/util/globalConfig'
import widgets from 'cesium/Widgets/widgets.css'
import Bus from '../../common/buss/util/bus'

import coordinates from '../../common/buss/DataStructure/Coordinates'

class CesiumViewer {

    // 静态方法作为广为人知的接口
    static getInstance() {

        if (!this.instance) {
            this.instance = new CesiumViewer();
        }
        return this.instance;
    }

    //构造函数
    constructor() {
        this.instance = null;
        this.viewer = null;
        this.viewerlist=[];
        Cesium.Ion.defaultAccessToken = '此处自己申请';
    }

    //注册界面id 在vue中调用
    Register(id) {
        //Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyNThiOTQ5Yi04OTkzLTQzZWUtOTJlMC01OTQxNGU0YzMxZWIiLCJpZCI6NzY2OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU1NDE2OTI3Nn0.5Q_q6jBgYzvO_EKF8V8ypFOkwEc92rLSb9weyeTKoBg'
        this.viewer = new Cesium.Viewer(id,
            {
                terrainProvider: Cesium.createWorldTerrain(),//加载默认世界dem
                // imageryProvider:new Cesium.WebMapTileServiceImageryProvider({
                //     url:globalconfig.configdata.modules.Scene.Tdt.imageurl+globalconfig.configdata.modules.Scene.Tdt.key,
                //     layer: "tdtImgBasicLayer",
                //     style: "default",
                //     format: "image/jpeg",
                //     tileMatrixSetID: "GoogleMapsCompatible",
                //
                // }),//默认加载天地图全球影像
            //     imageryProvider:new Cesium.UrlTemplateImageryProvider({
            //         url:"http://192.168.1.201:8080/gis/static/data/tiandit/{z}/{x}_{y}.png"
            //     }),

                timeline: false,//下方时间轴
                animation: false,//左下角大圆盘
                navigationHelpButton: false,//帮助按钮
                //sceneModePicker: false,//切换平坦模式和球状模式的按钮
                homeButton: false,//home按钮
                geocoder: false,//查询按钮
                baseLayerPicker: false,//地图切换按钮
                // shouldAnimate : true,
                //baseLayerPicker:false
                shadows:true,
               // fullscreenButton: false
            });



        this.viewer.selectedImageryProviderViewModel = null;
        this.viewer.scene.globe.depthTestAgainstTerrain = true;

        //scenemodepicker特殊样式设定
        this.viewer.sceneModePicker._wrapper.style.marginTop="100px";
        this.viewer.sceneModePicker._wrapper.childNodes[0].style.backgroundColor="#015d58";
        this.viewer.sceneModePicker._wrapper.childNodes[1].style.backgroundColor="#015d58";
        this.viewer.sceneModePicker._wrapper.childNodes[2].style.backgroundColor="#015d58";
        this.viewer.sceneModePicker._wrapper.childNodes[3].style.backgroundColor="#015d58";


        //cesium的fullscreenbutton把escape键屏蔽了，导致vue中接收不到该事件，
        // 所以fullscreen没有写进navigation组件，在此处修改其属性，用原生的全屏按钮并和navigation组件中的其他按钮拼在一起。
        this.viewer.fullscreenButton._container.childNodes[0].style.backgroundColor="#00DCD94C";
        this.viewer.fullscreenButton._container.childNodes[0].style.width="34px";
        this.viewer.fullscreenButton._container.childNodes[0].style.height="34px";
        this.viewer.fullscreenButton._container.childNodes[0].style.border="none";
        this.viewer.fullscreenButton._container.childNodes[0].style.position="fixed";
        this.viewer.fullscreenButton._container.childNodes[0].style.borderRadius="2px";
        this.viewer.fullscreenButton._container.childNodes[0].style.right="5px";
        this.viewer.fullscreenButton._container.childNodes[0].style.bottom="62px";
        this.viewer.fullscreenButton._container.childNodes[0].childNodes[0].style.width="28px";
        this.viewer.fullscreenButton._container.childNodes[0].childNodes[0].style.height="28px";
        this.viewer.fullscreenButton._container.childNodes[0].childNodes[0].style.left="3px";
        this.viewer.fullscreenButton._container.childNodes[0].childNodes[0].style.top="3px";

        //加载天地图影像
        //this.AddTdtLayer();

        if (globalconfig.configdata.modules.Scene.mesh.meshadd) {
            //加载mesh
            this.addmesh();
        }
        this.Adddltbtileset();
        this.Addbyztbtileset();
        this.dltbtileset.show = false;
        this.byztbtileset.show = false;
        //将注册商标隐藏
        this.viewer._cesiumWidget._creditContainer.style.display = "none";


        this.initAtmosphere();

        //左键双击事件触发
        this.viewer.screenSpaceEventHandler.setInputAction(function (movement) {
            Bus.$emit("Scene_Left_Double_Click", movement);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        //鼠标移动事件触发
        this.viewer.screenSpaceEventHandler.setInputAction(function (movement) {
            Bus.$emit("Scene_Mouse_Move", movement);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        //鼠标中键滚轮事件触发
        this.viewer.screenSpaceEventHandler.setInputAction(function (movement) {
            Bus.$emit("Scene_Mouse_Wheel", movement);
        }, Cesium.ScreenSpaceEventType.WHEEL);
        //鼠标右键单击事件触发
        this.viewer.screenSpaceEventHandler.setInputAction(function (movement) {
            Bus.$emit("Scene_Mouse_Right_Click", movement);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        //鼠标左键单击事件触发
        this.viewer.screenSpaceEventHandler.setInputAction(function (movement) {
            Bus.$emit("Scene_Mouse_Left_Click", movement);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //场景移动事件触发
        this.viewer.scene.camera.moveEnd.addEventListener(function () {
            Bus.$emit("Scene_Camera_MoveEnd");
        });
        this.viewer.scene.camera.changed.addEventListener(function () {
            Bus.$emit("Scene_Camera_Changed");
        });

        this.viewerlist.push({
            viewer:this.viewer,
            id:id
        })

        // var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        // var viewer=this.viewer;
        // handler.setInputAction(function(event) {
        //     var earthPosition = viewer.scene.pickPosition(event.position);
        //     if(Cesium.defined(earthPosition)){
        //         var cartographic = Cesium.Cartographic.fromCartesian(earthPosition);
        //         var lon_f = Cesium.Math.toDegrees(cartographic.longitude); //lon
        //         var lat_f = Cesium.Math.toDegrees(cartographic.latitude); //lat
        //         console.log("lat:"+lat_f.toString()+"lon:"+lon_f.toString());
        //         var po_hig = cartographic.height;//这个就是获取的模型上的高度
        //     }
        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);




    }


    GetViewerByContainerid(id)
    {
        if(!id) return this.viewer;
        for(var i=0;i<this.viewerlist.length;i++){
            if(this.viewerlist[i].id==id)
                return this.viewerlist[i].viewer;
        }
        return null;
    }

    RegisterOverView(id,options)
    {
        var overviewviewer=this.GetViewerByContainerid(id);
        if(overviewviewer) return;
        overviewviewer = new Cesium.Viewer(id,options);
        overviewviewer.screenSpaceEventHandler.setInputAction(function (movement) {
            Bus.$emit(id+"Scene_Left_Double_Click", movement);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        //将注册商标隐藏
        overviewviewer._cesiumWidget._creditContainer.style.display = "none";

        this.viewerlist.push({
            viewer:overviewviewer,
            id:id
        });
    }


    //加载天地图影像
    AddTdtLayer() {
        //全球影像中文注记
        this.viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
            url: globalconfig.configdata.modules.Scene.Tdt.labelurl + globalconfig.configdata.modules.Scene.Tdt.key,
            layer: "tdtAnnoLayer",
            style: "default",
            format: "image/jpeg",
            tileMatrixSetID: "GoogleMapsCompatible",
            show: false
        }));

    }

    initAtmosphere(){

        this.SnowStage = new Cesium.PostProcessStage({
            name: 'czm_snow',
            fragmentShader:"uniform sampler2D colorTexture; //输入的场景渲染照片\n" +
                "varying vec2 v_textureCoordinates;\n" +
                "\n" +
                "float snow(vec2 uv,float scale)\n" +
                "{\n" +
                "    float time = czm_frameNumber / 60.0;\n" +
                "    float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n" +
                "    uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n" +
                "    uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n" +
                "    p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n" +
                "    k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n" +
                "    return k*w;\n" +
                "}\n" +
                "\n" +
                "void main(void){\n" +
                "    vec2 resolution = czm_viewport.zw;\n" +
                "    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n" +
                "    vec3 finalColor=vec3(0);\n" +
                "    //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));\n" +
                "    float c = 0.0;\n" +
                "    c+=snow(uv,30.)*.0;\n" +
                "    c+=snow(uv,20.)*.0;\n" +
                "    c+=snow(uv,15.)*.0;\n" +
                "    c+=snow(uv,10.);\n" +
                "    c+=snow(uv,8.);\n" +
                "    c+=snow(uv,6.);\n" +
                "    c+=snow(uv,5.);\n" +
                "    finalColor=(vec3(c)); //屏幕上雪的颜色\n" +
                "    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5);  //将雪和三维场景融合\n" +
                "\n" +
                "}"
        });
        this.viewer.scene.postProcessStages.add(this.SnowStage);
        this.SnowStage.enabled=false;

       this.RainStage=new Cesium.PostProcessStage({
           "name":"czm_rain",
           fragmentShader:"uniform sampler2D colorTexture;//输入的场景渲染照片\n" +
               "varying vec2 v_textureCoordinates;\n" +
               "\n" +
               "float hash(float x){\n" +
               "    return fract(sin(x*133.3)*13.13);\n" +
               "}\n" +
               "\n" +
               "void main(void){\n" +
               "\n" +
               "    float time = czm_frameNumber / 60.0;\n" +
               "    vec2 resolution = czm_viewport.zw;\n" +
               "\n" +
               "    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n" +
               "    vec3 c=vec3(.6,.7,.8);\n" +
               "\n" +
               "    float a=-.4;//雨跟地面的夹角\n" +
               "    float si=sin(a),co=cos(a);\n" +
               "    uv*=mat2(co,-si,si,co);\n" +
               "    uv*=length(uv+vec2(0,4.9))*.3+1.;\n" +
               "\n" +
               "    float v=1.-sin(hash(floor(uv.x*100.))*2.);\n" +
               "    float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n" +
               "    c*=v*b; //屏幕上雨的颜色\n" +
               "\n" +
               "    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5); //将雨和三维场景融合\n" +
               "}",

       });
        this.viewer.scene.postProcessStages.add(this.RainStage);
        this.RainStage.enabled=false;

        this.FogStage=Cesium.PostProcessStageLibrary.createBrightnessStage();
        //this.FogStage.uniforms.brightness=2;//整个场景通过后期渲染变亮 1为保持不变 大于1变亮 0-1变暗 uniforms后面为对应glsl里面定义的uniform参数
        this.FogStage=new Cesium.PostProcessStage({
            "name":"self",
            //sampleMode:PostProcessStageSampleMode.LINEAR,
            fragmentShader:"  uniform sampler2D colorTexture;\n" +
                "  uniform sampler2D depthTexture;\n" +
                "  varying vec2 v_textureCoordinates;\n" +
                "  void main(void)\n" +
                "  {\n" +
                "      vec4 origcolor=texture2D(colorTexture, v_textureCoordinates);\n" +
                "      vec4 fogcolor=vec4(0.8,0.8,0.8,0.5);\n" +
                "\n" +
                "      float depth = czm_readDepth(depthTexture, v_textureCoordinates);\n" +
                "      vec4 depthcolor=texture2D(depthTexture, v_textureCoordinates);\n" +
                "\n" +
                "      float f=(depthcolor.r-0.22)/0.2;\n" +
                "      if(f<0.0) f=0.0;\n" +
                "      else if(f>1.0) f=1.0;\n" +
                "      gl_FragColor = mix(origcolor,fogcolor,f);\n" +
                "   }"
        });



        this.viewer.scene.postProcessStages.add(this.FogStage);
        this.FogStage.enabled=false;
    }
    addmesh() {
        var meshurls = globalconfig.configdata.modules.Scene.mesh.meshurls;
        this.meshtiles = [];
        var terrainProvider = Cesium.createWorldTerrain();
        for (var i = 0; i < meshurls.length; i++) {
            var tileset = this.viewer.scene.groundPrimitives.add(new Cesium.Cesium3DTileset({
                url: meshurls[i].url,
                maximumMemoryUsage: 128,
                //classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
                // skipScreenSpaceErrorFactor:32,
                // skipLevels:5
                // clippingPlanes: new Cesium.ClippingPlaneCollection({
                //     planes : [
                //         new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 0.005)
                //     ],
                // })
            }));
            tileset.show = true;
            this.meshtiles.push(tileset);
            if (meshurls[i].flyto) {
                this.meshtilesetflyto = tileset;
            }

            var that=this;
            tileset.readyPromise.then(function (tileset) {
                // Adjust a tileset's height from the globe's surface.
                //var heightOffset = 20.0;
                var boundingSphere = tileset.boundingSphere;
                var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
                var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);//原始坐标
                //var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
                // var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
                // tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

                var positions = [
                    Cesium.Cartographic.fromDegrees(cartographic.longitude,cartographic.latitude)
                ];
                var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
                Cesium.when(promise, function(updatedPositions) {
                    var terrainHeight = updatedPositions[0].height;
                    var offset=Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, terrainHeight);//新坐标
                    var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());//做差得到变换矩阵
                    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
                });



            }).otherwise(function (error) {
                console.log(error);
            });


            // var m = Cesium.Matrix4.fromArray([
            //     1.0, 0.0, 0.0, 0.0,
            //     0.0, 1.0, 0.0, 0.0,
            //     0.0, 0.0, 1.0, 0.0,
            //     0, 0, 100, 1.0
            // ]);

             //tileset.modelMatrix = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromArray([meshurls[i].xoffset,meshurls[i].yoffset, meshurls[i].heightoffset]));
           // tileset.modelMatrix = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromArray([0, 0, 5]));
            //tileset.modelMatrix=m;
        }

        //var that = this;
        // Bus.$on("Scene_Camera_MoveEnd", function () {
        //     console.log(that.viewer.camera.getMagnitude() + "," + that.GetCamera().height + "," + that.GetCamera().pitch + "," + that.GetCamera().height / that.GetCamera().pitch);
        //     if (Math.abs(that.GetCamera().height / that.GetCamera().pitch) > 50) {
        //         that.meshtiles.forEach(mesh => {
        //             mesh.show = false;
        //
        //         });
        //
        //     }
        //     else {
        //         that.meshtiles.forEach(mesh => {
        //             mesh.show = true;
        //         });
        //
        //     }
        // });
    }

    Adddltbtileset() {
        this.dltbtileset = new Cesium.Cesium3DTileset({
            url: globalconfig.configdata.modules.WuxiOnePicture.meshdltburl,
            classificationType: Cesium.ClassificationType.BOTH,
            maximumMemoryUsage: 128,
        });
        this.dltbtile_style_color_condition = [
            {dlmc: "河流水面", red: 251, green: 147, blue: 229, alpha: 0.3},
            {dlmc: "空闲地", red: 124, green: 219, blue: 106, alpha: 0.5},
            {dlmc: "旱地", red: 208, green: 140, blue: 83, alpha: 0.5},
            {dlmc: "物流仓储用地", red: 69, green: 151, blue: 191, alpha: 0.5},
            {dlmc: "其他园地", red: 35, green: 76, blue: 145, alpha: 0.5},
            {dlmc: "城镇村道路用地", red: 129, green: 70, blue: 86, alpha: 0.5},
            {dlmc: "公园与绿地", red: 168, green: 245, blue: 236, alpha: 0.5},
            {dlmc: "工业用地", red: 98, green: 148, blue: 66, alpha: 0.3},
            {dlmc: "商业服务业设施用地", red: 242, green: 237, blue: 137, alpha: 0.5},
            {dlmc: "水田", red: 157, green: 93, blue: 231, alpha: 0.5},
            {dlmc: "机关团体新闻出版用地", red: 126, green: 129, blue: 205, alpha: 0.5},
            {dlmc: "农村道路", red: 197, green: 74, blue: 76, alpha: 0.5},
            {dlmc: "交通服务场站用地", red: 145, green: 74, blue: 145, alpha: 0.5},
            {dlmc: "农村宅基地", red: 201, green: 91, blue: 167, alpha: 0.5},
            {dlmc: "城镇住宅用地", red: 152, green: 146, blue: 57, alpha: 0.5},
            {dlmc: "科教文卫用地", red: 233, green: 141, blue: 153, alpha: 0.5},
            {dlmc: "公路用地", red: 74, green: 171, blue: 112, alpha: 0.5},
            {dlmc: "湖泊水面", red: 233, green: 141, blue: 153, alpha: 0.5},
            {dlmc: "其他林地", red: 133, green: 111, blue: 36, alpha: 0.5},
            {dlmc: "坑塘水面", red: 90, green: 111, blue: 137, alpha: 0.5},
            {dlmc: "设施农用地", red: 167, green: 199, blue: 251, alpha: 0.5},
            {dlmc: "果园", red: 165, green: 199, blue: 76, alpha: 0.5},
            {dlmc: "公用设施用地", red: 167, green: 209, blue: 141, alpha: 0.5},
            {dlmc: "特殊用地", red: 217, green: 185, blue: 145, alpha: 0.5},
            {dlmc: "管道运输用地", red: 80, green: 167, blue: 151, alpha: 0.5},
            {dlmc: "铁路用地", red: 98, green: 148, blue: 66, alpha: 0.5},
            {dlmc: "机场用地", red: 67, green: 89, blue: 192, alpha: 0.5},
            {dlmc: "水工建筑用地", red: 112, green: 86, blue: 133, alpha: 0.5},
            {dlmc: "轨道交通用地", red: 121, green: 227, blue: 197, alpha: 0.5},
            {dlmc: "田坎", red: 207, green: 91, blue: 167, alpha: 0.5},
            {dlmc: "沟渠", red: 80, green: 213, blue: 213, alpha: 0.5},
            {dlmc: "内陆滩涂", red: 207, green: 91, blue: 167, alpha: 0.5},
            {dlmc: "工用地", red: 232, green: 187, blue: 73, alpha: 0.5},
            {dlmc: "城镇村住宅用地", red: 53, green: 142, blue: 57, alpha: 0.5},
            {dlmc: "机关团体及新闻出版用地", red: 157, green: 93, blue: 231, alpha: 0.5},
            {dlmc: "可调整养殖坑塘", red: 126, green: 212, blue: 243, alpha: 0.5},
            {dlmc: "可调整其他园地", red: 232, green: 223, blue: 105, alpha: 0.5},
            {dlmc: "养殖坑塘", red: 197, green: 74, blue: 73, alpha: 0.5},
            {dlmc: "茶园", red: 162, green: 157, blue: 89, alpha: 0.5},
            {dlmc: "乔木林地", red: 51, green: 246, blue: 73, alpha: 0.5},
            {dlmc: "其他草地", red: 112, green: 200, blue: 100, alpha: 0.5},
            {dlmc: "可调整果园", red: 145, green: 210, blue: 145, alpha: 0.3},
            {dlmc: "广场用地", red: 189, green: 112, blue: 198, alpha: 0.3},
            {dlmc: "工用地", red: 179, green: 157, blue: 107, alpha: 0.3},
            {dlmc: "城镇村住宅用地", red: 232, green: 124, blue: 129, alpha: 0.3},
            {dlmc: "机关团体及新闻出版用地", red: 110, green: 86, blue: 133, alpha: 0.3},
            {
                dlmc: "其他",
                red: 255,
                green: 255,
                blue: 0,
                alpha: 0.3
            },
        ];
        var stylecondition = this.gettilesetcolorconditonfromarray(this.dltbtile_style_color_condition);
        this.dltbtileset.style = new Cesium.Cesium3DTileStyle({
            color: {
                conditions: stylecondition
            },
        });
        this.dltbtileset.show = false;
        this.viewer.scene.primitives.add(this.dltbtileset);

    }

    gettilesetcolorconditonfromarray(array) {
        var arrayresult = [];
        array.forEach(item => {
            // '${dlmc} === "内陆滩涂"', 'rgba(232, 187, 73, 0.5)'
            // 'true', 'rgba(255, 255, 0, 0.5)'
            arrayresult.push([
                item.dlmc === "其他" ? 'true' :
                    '${dlmc}===' + '"' + item.dlmc + '"'
                ,
                'rgba(' + item.red + ', ' + item.green + ', ' + item.blue + ', ' + item.alpha + ')'
            ]);
        });
        return arrayresult;
    }

    GetDLTBCondition() {
        return this.dltbtile_style_color_condition;
    }

    Addbyztbtileset() {
        //不一致图斑添加
        this.byztbtileset = new Cesium.Cesium3DTileset({
            url:globalconfig.configdata.modules.WuxiOnePicture.meshbyztburl,
            classificationType: Cesium.ClassificationType.BOTH,
        });
        this.byztbtileset.style = new Cesium.Cesium3DTileStyle({
            color: 'rgba(255, 0, 0, 0.3)',
            // labelText:'"nihao"',
            // labelColor:'color("blue")',
            // labelVerticalOrigin:Cesium.VerticalOrigin.BASELINE
        });
        this.byztbtileset.show = false;
        this.viewer.scene.primitives.add(this.byztbtileset);
    }

    SetFog(enabled,density,minimumBrightness,screenSpaceErrorFactor)
    {
        if(!this.FogStage) return;
        this.FogStage.enabled=enabled;

        // this.viewer.scene.fog.enabled=enabled;
        // this.viewer.scene.fog.density=density;
        // this.viewer.scene.fog.minimumBrightness=minimumBrightness;
        // this.viewer.scene.fog.screenSpaceErrorFactor=screenSpaceErrorFactor;
    }
    SetSnowVisible(visible)
    {
        if(!this.SnowStage) return;
        this.SnowStage.enabled=visible;
    }
    SetRainVisible(visible)
    {
        if(!this.RainStage) return;
        this.RainStage.enabled=visible;
    }

    SetSceneMode(scenemode)
    {
        this.viewer.scene.mode=scenemode;
    }
    SetCurrentTime(year,month,day,hour,minute,second)
    {
        var date=new Date(year,month-1,day,hour,minute,second);
        var julian_time=Cesium.JulianDate.fromDate(date);
        this.viewer.clock.currentTime= julian_time;
    }

    SetByztbTilesetShow(show) {
        this.byztbtileset.show = show;
    }

    SetDltbTilesetShow(show) {
        this.dltbtileset.show = show;
    }


    ZoomToMesh() {
        if (this.meshtilesetflyto) {
            var that = this;
            this.meshtilesetflyto.readyPromise.then(function (tileset) {
                that.viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0, -1.15, tileset.boundingSphere.radius * 2.8));
            }).otherwise(function (error) {
                console.log(error);
            });
        }
    }

    ZoomTo(target,offset,viewercontainerid){
        if(viewercontainerid)
        {
            var viewer=this.GetViewerByContainerid(viewercontainerid);
            if(viewer)
            {
                viewer.zoomTo(target,offset);
            }
        }
        else {
            this.viewer.zoomTo(target,offset);
        }

    }

    GetSceneMode(){
        return this.viewer.scene.mode;
    }

    //heading\pitch都为角度，roll目前全部传参为0
    CameraGoTo(latitude, longitude, height, heading, pitch, roll) {
        // camera set to a position with an orientation using heading, pitch and roll.
        this.viewer.scene.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            orientation: {
                heading: Cesium.Math.toRadians(heading),
                pitch: Cesium.Math.toRadians(pitch),
                roll: Cesium.Math.toRadians(roll)
            }
        });
    }


    //获取圆上另一个点
    //第一个参数wgs84poi表示圆上已知点，第二个参数heading表示第一个参数对应的heading，第三个参数表示新点的heading，第四个参数表示原始点和返回点的倾斜角（相同）
    //返回新点的wgs84poi经纬度坐标
    GetPointOnSameCircle(wgs84poi,heading,headingnew,pitch)
    {
        // heading=heading+180;
        // headingnew=headingnew+180;
        heading=270-heading;
        headingnew=270-headingnew;
        var planedis=wgs84poi.height/(Math.tan(Cesium.Math.toRadians(0-pitch)));
        var mercatorpoi=coordinates.CoordinateMercator.fromWGS84(wgs84poi);
        // var x1=mercatorpoi.Mercator_X-planedis*Math.sin(Cesium.Math.toRadians(heading))+planedis*Math.sin(Cesium.Math.toRadians(headingnew));
        // var y1=mercatorpoi.Mercator_Y-planedis*Math.cos(Cesium.Math.toRadians(heading))+planedis*Math.cos(Cesium.Math.toRadians(headingnew));
        var x1=mercatorpoi.Mercator_X-planedis*Math.cos(Cesium.Math.toRadians(heading))+planedis*Math.cos(Cesium.Math.toRadians(headingnew));
        var y1=mercatorpoi.Mercator_Y-planedis*Math.sin(Cesium.Math.toRadians(heading))+planedis*Math.sin(Cesium.Math.toRadians(headingnew));
        return coordinates.CoordinateWGS84.fromMercatorxyh(x1,y1,wgs84poi.height);
    }

    //heading\pitch都为角度，roll目前全部传参为0 duration单位为秒
    FlyToWithDuration(latitude, longitude, height, heading, pitch, roll, duration, viewerContainerId) {
        if(viewerContainerId){
            this.viewer = this.GetViewerByContainerid(viewerContainerId);
        }
        if(duration===-1)
        {
            this.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
                orientation: {
                    heading: Cesium.Math.toRadians(heading),
                    pitch: Cesium.Math.toRadians(pitch),
                    roll: Cesium.Math.toRadians(roll)
                },
                maximumHeight:10
                // maximumHeight:10,
                // pitchAdjustHeight:10,
                //easingFunction : Cesium.EasingFunction.BACK_IN_OUT
            });
        }
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            orientation: {
                heading: Cesium.Math.toRadians(heading),
                pitch: Cesium.Math.toRadians(pitch),
                roll: Cesium.Math.toRadians(roll)
            },
            duraion: duration
        });
    }

    FlyToRectangleWithDuration(longitude_west,latitude_south,longitude_east,latitude_north,duration){
        if(duration==-1)
            this.viewer.camera.flyTo({
                destination:Cesium.Rectangle.fromDegrees(longitude_west,latitude_south,longitude_east,latitude_north)
            });
        else{
            this.viewer.camera.flyTo({
                destination:Cesium.Rectangle.fromDegrees(longitude_west,latitude_south,longitude_east,latitude_north,duration)
            });
        }
    }


    GetCamera() {
        var ellipsoid = this.viewer.scene.globe.ellipsoid;
        var cartesian3 = this.viewer.camera.position;
        var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var alt = cartographic.height;
        return {
            longitude: lng,
            latitude: lat,
            height: alt,
            heading: Cesium.Math.toDegrees(this.viewer.camera.heading),
            pitch: Cesium.Math.toDegrees(this.viewer.camera.pitch),
            roll: Cesium.Math.toDegrees(this.viewer.camera.roll),
        }
    }



    Zoomin(val)
    {
        this.viewer.camera.zoomIn(val);
    }
    Zoomout(val){
        this.viewer.camera.zoomOut(val);
    }

    GetPickedEllipsoidPositionWGS84(pos) {
        var cartesian = this.viewer.camera.pickEllipsoid(pos, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height;
            return new coordinates.CoordinateWGS84(longitude, latitude, height);
        }
        return null;
    }

    GetPickedFeature(pos)
    {
        // Pick a new feature
        var pickedFeature = this.viewer.scene.pick(pos);
        if (!Cesium.defined(pickedFeature)) return null;
        return pickedFeature;
    }

    Pickdrill(windowpos,width,height)
    {
        var pickedObjects = this.viewer.scene.drillPick(windowpos,100000,width,height);
        pickedObjects.forEach(item=>{
            var style=item.primitive.style;

            style.readyPromise.then(function (style) {
                style.pointSize=4;
                item.primitive.style=style;
            })

        })
        var ttt=0;
    }


    GetPickedRayPositionWGS84(pos)
    {
        var ray=this.viewer.camera.getPickRay(pos);
        var x=Cesium.Math.toDegrees(ray.direction.x);
        var y=Cesium.Math.toDegrees(ray.direction.y);
        var z=Cesium.Math.toDegrees(ray.direction.z);
        var position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        //var position = this.viewer.camera.pickEllipsoid(pos, this.viewer.scene.globe.ellipsoid);
        var feature=this.viewer.scene.pick(pos);
        if(!feature||feature===null)
        {
            if(Cesium.defined(position))
            {
                return coordinates.CoordinateWGS84.fromCatesian(position);
            }
        }
        else{
            var cartesian = this.viewer.scene.pickPosition(pos);
            if (Cesium.defined(cartesian))
            {
                return coordinates.CoordinateWGS84.fromCatesianWithCartographic(cartesian);
            }
        }
        return null;
    }

    GetNowRayPositionWGS84()
    {
       return this.GetPickedRayPositionWGS84(new Cesium.Cartesian2(
           document.getElementsByClassName("cesium-viewer")[0].clientWidth/2,
           document.getElementsByClassName("cesium-viewer")[0].clientHeight/2));
    }

    AddEntity(entity)
    {
        this.viewer.entities.add(entity);
    }
    RemoveEntityById(entityid)
    {
        this.viewer.entities.removeById(entityid);
    }
    SetEntity(entity)
    {
        var entityori=this.viewer.entities.getById(entity.id);
        if(entityori)
        {
            this.viewer.entities.remove(entityori);

        }
        //this.viewer.entities.values.unshift(entity);
        this.viewer.entities.add(entity);
    }
    GetEntityById(entityid){
        return this.viewer.entities.getById(entityid);
    }
    AddWMSImageryProvider(url,layername)
    {
        var result= this.viewer.scene.globe.imageryLayers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({  //加载一个新的图层
            url : url,
            layers: layername,
            parameters: {
                service : 'WMS',
                format: 'image/png',
                transparent: true,
            }
        }));
        return result;
    }

    RmoveWMSImageryProvider(imagerylayer){
        this.viewer.scene.globe.imageryLayers.remove(imagerylayer);
    }


    AddPrimitive(primitive,viewercontainerid)
    {
        if(viewercontainerid)
        {
            var thistimeviewer=this.GetViewerByContainerid(viewercontainerid);
            if(thistimeviewer)
            {
                return thistimeviewer.scene.primitives.add(primitive);
            }
            return null;
        }
        else {
            return this.viewer.scene.primitives.add(primitive);
        }

    }

    RemovePrimitive(primitive)
    {
        this.viewer.scene.primitives.remove(primitive);
    }
    GetWindowPosFromCartesian(cartesian)
    {
        return Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, cartesian);
    }
    GetWindowPosFromWGS84(wgs84pos)
    {
        return this.GetWindowPosFromCartesian(Cesium.Cartesian3.fromDegrees(wgs84pos.longitude, wgs84pos.latitude, wgs84pos.height));
    }
    GetLerpWGS84(wgs84pos1,wgs84pos2,tpoint)
    {
        var cartesian1=Cesium.Cartesian3.fromDegrees(wgs84pos1.longitude, wgs84pos1.latitude, wgs84pos1.height);
        var cartesian2=Cesium.Cartesian3.fromDegrees(wgs84pos2.longitude, wgs84pos2.latitude, wgs84pos2.height);
        var cartesian3=Cesium.Cartesian3.lerp(cartesian1,cartesian2,tpoint,new Object());
        var cartographic=this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian3);
        return new coordinates.CoordinateWGS84(Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
            cartographic.height);

    }
    AddPostRenderEventListener(func)
    {
        this.viewer.scene.postRender.addEventListener(func);
    }
    RemovePostRenderEventListener(func)
    {
        this.viewer.scene.postRender.removeEventListener(func);
    }
    getdeminterationPoint(cartesian3_poi,cartesian3_dir)
    {
        var ray=new Cesium.Ray(cartesian3_poi,cartesian3_dir);
        var interation=this.viewer.scene.globe.pick(ray,this.viewer.scene);
        if (Cesium.defined(interation))
        {
            var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(interation);
            return new coordinates.CoordinateWGS84(Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude),
                cartographic.height);
            // return{
            //     Latitude:Cesium.Math.toDegrees(cartographic.latitude),
            //     Longitude:Cesium.Math.toDegrees(cartographic.longitude),
            //     Altitude:cartographic.height
            // }
        }
        else
            return null;
    }
    GetNowDEMInterationPoint()
    {
        var cartesian3_poi=this.viewer.camera.position;
        var cartesian3_dir=this.viewer.camera.direction;
        return this.getdeminterationPoint(cartesian3_poi,cartesian3_dir);
    }


    GetCartesianFromWindowpos(x,y){
        return this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(new Cesium.Cartesian2(x,y)),this.viewer.scene);;
    }
    //像素坐标转地理坐标
    GetGeoCSFromWindowpos(movement,id) {
        if(id)
        {
            this.viewer = this.GetViewerByContainerid(id);
        }
        let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(movement.position), this.viewer.scene);
        let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
        let lat = Cesium.Math.toDegrees(cartographic.latitude);
        let lng = Cesium.Math.toDegrees(cartographic.longitude);
        let alt = cartographic.height;
        return {lat: lat, lng: lng, alt: alt};
    }

}


export default {
    CesiumViewer,
}
