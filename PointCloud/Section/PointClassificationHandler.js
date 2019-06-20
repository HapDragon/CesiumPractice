import cesiumviewer from '../../../MainGIS/buss/CesiumViewer'
import globalconfig from '../../../common/buss/util/globalConfig'
import colormodel from '../../../common/buss/DataStructure/ColorModel'
import coordinate from '../../../common/buss/DataStructure/Coordinates'
import Cesium from 'cesium/Cesium'

let pointcloudprimitive=null;//点云primitive
let pointcloudPrimitivewithclip=null;//进行切面后的点云primitive
let cloudpointsize=1;//默认点大小
//以下三个点是确定clippingplane的依据，通过这三个点需要确定四个平面用于切割点云
let mousemoveovercartesianpos2=new Cesium.Cartesian3();//第二个点的笛卡尔坐标
let mousemoveovercartesianpos3=new Cesium.Cartesian3();//第三个点的笛卡尔坐标
let mouseclickcartesianpos1=new Cesium.Cartesian3();//第一个点的笛卡尔坐标
let mousemovecartesianpos4=new Cesium.Cartesian3();//第四个点的笛卡尔坐标 计算clippingplane时算出
let mousemovecartesianpos5=new Cesium.Cartesian3();//第五个点的笛卡尔坐标 计算clippingplane时算出




let pointCloudSectionViewer=null;//点云剖面显示窗口对应的cesium viewer
let PointCloudSectionContainerID="pointcloudsectioncontain";//点云剖面显示窗口对应的cesium viewer的containerid
let pointsectionentityid="pointsectionentityid";//点云剖面范围在主场景中entity的id

//根据高程分类渲染
function HandleClassByElevation() {
    var elevationcolorconditions=[];
    //使用配置文件
    // for(var i=0;i<globalconfig.configdata.modules.PointCloud.ElevationColorRank.length;i++)
    // {
    //     var item=globalconfig.configdata.modules.PointCloud.ElevationColorRank[i];
    //     elevationcolorconditions.push([
    //         '${GpsTime} >= '+item.value,
    //         colormodel.ColorModel.FromHexRGB(globalconfig.themesdata.defaulttheme.colors[item.colorindex]).toRGBstring()
    //     ])
    // }

    //使用自适应 跨越整个彩色范围
    var colormodels=colormodel.ColorModel.GetRGBRanks_FromBlueToRed(globalconfig.configdata.modules.PointCloud.ElevationColorNum);
    // var colormodels=colormodel.ColorModel.GetGradientColor(new colormodel.ColorModel(0,0,255),new colormodel.ColorModel(255,0,0),globalconfig.configdata.modules.PointCloud.ElevationColorNum);
    var elevalueadd=(globalconfig.configdata.modules.PointCloud.ElevationMax-globalconfig.configdata.modules.PointCloud.ElevationMin)/globalconfig.configdata.modules.PointCloud.ElevationColorNum;
    for(var i=colormodels.length-1;i>=0;i--)
    {
        var elenow=globalconfig.configdata.modules.PointCloud.ElevationMin+i*elevalueadd;
        elevationcolorconditions.push([
            '${GpsTime} >= '+elenow,
            colormodels[i].toRGBstring()
        ])
    }

    setpointcloud();


    // //添加primitive
    // pointcloudprimitive=cesiumviewer.CesiumViewer.getInstance().AddPrimitive(new Cesium.Cesium3DTileset({
    //     url: globalconfig.configdata.modules.PointCloud.url,
    //     classificationType:Cesium.ClassificationType.TERRAIN
    // }));
    pointcloudprimitive.style=new Cesium.Cesium3DTileStyle({
        color:
        //'rgb(255, 0, 0)'
            {
                conditions: elevationcolorconditions
            },
        pointSize:cloudpointsize
    });
    pointzoomto();
}

//根据强度分类渲染
function HandleClassByIntensity() {
    var elevationcolorconditions=[];
    //所有颜色均使用配置文件
    // for(var i=0;i<globalconfig.configdata.modules.PointCloud.IntensityColorRank.length;i++)
    // {
    //     var item=globalconfig.configdata.modules.PointCloud.IntensityColorRank[i];
    //     elevationcolorconditions.push([
    //         '${Intensity} >= '+item.value,
    //         colormodel.ColorModel.FromHexRGB(globalconfig.themesdata.defaulttheme.colors[item.colorindex]).toRGBstring()
    //     ])
    // }

    //使用自适应 跨越整个彩色范围
    var colormodels=colormodel.ColorModel.GetGradientColor(new colormodel.ColorModel(100,100,100),new colormodel.ColorModel(255,255,255),globalconfig.configdata.modules.PointCloud.IntensityColorNum);
    var elevalueadd=(globalconfig.configdata.modules.PointCloud.IntensityMax-globalconfig.configdata.modules.PointCloud.IntensityMin)/globalconfig.configdata.modules.PointCloud.IntensityColorNum;
    for(var i=colormodels.length-1;i>=0;i--)
    {
        var elenow=globalconfig.configdata.modules.PointCloud.IntensityMin+i*elevalueadd;
        elevationcolorconditions.push([
            '${Intensity} >= '+elenow,
            colormodels[i].toRGBstring()
        ])
    }

  setpointcloud();

    pointcloudprimitive.style=new Cesium.Cesium3DTileStyle({
        color:
            {
                conditions: elevationcolorconditions
            },
        pointSize:cloudpointsize
    });
    pointcloudprimitive.readyPromise.then(function(tileset) {
        cesiumviewer.CesiumViewer.getInstance().ZoomTo(tileset,new Cesium.HeadingPitchRange(0, -0.8, tileset.boundingSphere.radius * 2.8));
    }).otherwise(function(error) {
        console.log(error);
    });
}

//根据RGB真彩色分类渲染
function HandleClassByRGB() {
   setpointcloud();

    pointcloudprimitive.style=new Cesium.Cesium3DTileStyle({
        color:'rgb(${UserData},${PointSourceId/256},${PointSourceId%256})',
        pointSize:cloudpointsize
    });
    pointzoomto();
}

function HandleClassByClassification(classitems) {
    var classificationcondition=[];
    //所有颜色均使用配置文件
    classitems.forEach(item=>{
        classificationcondition.push([
            //'${Classification}==='+ '"' + item.value + '"',
            '${Classification}==='+ item.value,
            colormodel.ColorModel.FromHexRGB(item.rgbcolor).toRGBAstring()
        ]);
    })

    classificationcondition.push([
        'true','rgba(0,0,0,0)'
    ]);
    setpointcloud();
    var style=new Cesium.Cesium3DTileStyle({
        color:
            {
                conditions: classificationcondition
            },
        pointSize:cloudpointsize
    });
    style.readyPromise.then(function(style) {
        pointcloudprimitive.style=style;
    }).otherwise(function(error) {
        console.log(error);
    });

   pointzoomto();

}

function HandleClassByNumberofReturns(classitems) {
    var numberofreturncondition=[];
    //所有颜色均使用配置文件
    classitems.forEach(item=>{
        numberofreturncondition.push([
            '${NumberOfReturns}==='+item.value,
            colormodel.ColorModel.FromHexRGB(item.rgbcolor).toRGBAstring()
        ]);
    });
    numberofreturncondition.push([
        'true','rgba(0,0,0,0)'
    ])
    setpointcloud();

    var style=new Cesium.Cesium3DTileStyle({
        color:
            {
                conditions: numberofreturncondition
            },
        pointSize:cloudpointsize
    });
    style.readyPromise.then(function(style) {
        pointcloudprimitive.style=style;
    }).otherwise(function(error) {
        console.log(error);
    });

    pointzoomto();
}

function SetPointSize(pointsize) {
    cloudpointsize=pointsize;
    if(pointcloudprimitive)
    {
        var stylenew=pointcloudprimitive.style;
        stylenew.readyPromise.then(function (style) {
            style.pointSize=pointsize;
            pointcloudprimitive.style=style;
        }).otherwise(function(error) {
            console.log(error);
        });

    }

}

function HandleLeftClickFirst(windowposcar) {
    // windowpos1=new Cesium.Cartesian2(windowposcar.x,windowposcar.y);
    mouseclickcartesianpos1=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowposcar.x,windowposcar.y);
}

function HandleLeftClickSecond(windowposcar) {
    //windowpos2=new Cesium.Cartesian2(windowposcar.x,windowposcar.y);
    mousemoveovercartesianpos2=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowposcar.x,windowposcar.y);
}

function HandleLeftClickThird(windowposcar) {
    //windowpos3=new Cesium.Cartesian2(windowposcar.x,windowposcar.y);
    mousemoveovercartesianpos3=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowposcar.x,windowposcar.y);
    refreshPointCloudSection();

}

function HandleMouseMoveBeforeSecondClick(windowposcar) {
    //画线
    mousemoveovercartesianpos2=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowposcar.x,windowposcar.y);
    // var catesianpos1=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowpos1.x,windowpos1.y);
    // var catesianpos2=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowposcar.x,windowposcar.y);
    cesiumviewer.CesiumViewer.getInstance().SetEntity(new Cesium.Entity({
        id:pointsectionentityid,
        polyline:{
            positions:[mouseclickcartesianpos1,mousemoveovercartesianpos2],
            material:new Cesium.Color(1,1,1,1),
            width:2,
            clampToGround:true
            // depthFailMaterial:this.Color.ToCesiumColor()
        }
    }));
}
function HandleMouseMoveBeforeThirdClick(windowposcar) {
    //画矩形
    //windowpos3=new Cesium.Cartesian2(windowposcar.x,windowposcar.y);
    // var catesianpos1=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowpos1.x,windowpos1.y);
    // var catesianpos2=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowpos2.x,windowpos2.y);
    mousemoveovercartesianpos3=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowposcar.x,windowposcar.y);
    getClippingPlanes1();

    cesiumviewer.CesiumViewer.getInstance().SetEntity({
        id:pointsectionentityid,
        polygon:{
            hierarchy:new Cesium.PolygonHierarchy([mouseclickcartesianpos1,mousemoveovercartesianpos2,mousemovecartesianpos5,mousemovecartesianpos4]),
            material:new Cesium.Color(0,1,0,0.8),
            outline:true,
            outlineWidth:2,
            //perPositionHeight:true //该属性代表使用每个点的高程，如果不设置则会贴地
            // height:0,
            //heightReference:Cesium.HeightReference.RELATIVE_TO_GROUND
        }
    });
 }

 function getClippingPlanes1() {
     var catesianpos0=pointcloudprimitive.boundingSphere.center;
     var catesiancamera=cesiumviewer.CesiumViewer.getInstance().GetViewerByContainerid().camera.position;
     var localpoi0=new Cesium.Cartesian3(0,0,0);


     var localpoi1=coordinate.CoordinateLocal.FromCartesian(mouseclickcartesianpos1,catesianpos0);
     var localpoi2=coordinate.CoordinateLocal.FromCartesian(mousemoveovercartesianpos2,catesianpos0);
     var localpoi3=coordinate.CoordinateLocal.FromCartesian(mousemoveovercartesianpos3,catesianpos0);
     var localpoicamera=coordinate.CoordinateLocal.FromCartesian(catesiancamera,catesianpos0);

     var clippingplanes=[];

     var dis3_12camera=getPointToPlane(localpoi3,localpoi1,localpoi2,localpoicamera);
     var dis0_12camera=getPointToPlane(localpoi0,localpoi1,localpoi2,localpoicamera);

     var planenorth1=new Cesium.Cartesian3(
         (localpoi2.y-localpoi1.y)*(localpoicamera.z-localpoi1.z)-(localpoi2.z-localpoi1.z)*(localpoicamera.y-localpoi1.y),
         (localpoi2.z-localpoi1.z)*(localpoicamera.x-localpoi1.x)-(localpoi2.x-localpoi1.x)*(localpoicamera.z-localpoi1.z),
         (localpoi2.x-localpoi1.x)*(localpoicamera.y-localpoi1.y)-(localpoi2.y-localpoi1.y)*(localpoicamera.x-localpoi1.x)
     )
     planenorth1=Cesium.Cartesian3.normalize(planenorth1,planenorth1);
     var scaleplanenorth1=new Cesium.Cartesian3();
     scaleplanenorth1=Cesium.Cartesian3.multiplyByScalar(planenorth1,dis3_12camera,scaleplanenorth1);
     planenorth1=Cesium.Cartesian3.normalize(scaleplanenorth1,planenorth1);

     var scaleplanenorth2=new Cesium.Cartesian3();
     scaleplanenorth2=Cesium.Cartesian3.multiplyByScalar(scaleplanenorth1,-1,scaleplanenorth2);
     var planenorth2=new Cesium.Cartesian3();
     planenorth2=Cesium.Cartesian3.normalize(scaleplanenorth2,planenorth2);

     var localpoi4=new Cesium.Cartesian3();
     var localpoi5=new Cesium.Cartesian3();
     localpoi4=Cesium.Cartesian3.add(localpoi1,scaleplanenorth1,localpoi4);
     localpoi5=Cesium.Cartesian3.add(localpoi2,scaleplanenorth1,localpoi5);
     mousemovecartesianpos4=coordinate.CoordinateLocal.ToCartesian(localpoi4,catesianpos0);
     mousemovecartesianpos5=coordinate.CoordinateLocal.ToCartesian(localpoi5,catesianpos0);

     clippingplanes.push(new Cesium.ClippingPlane(planenorth1, dis0_12camera*(dis3_12camera/Math.abs(dis3_12camera))));
     clippingplanes.push(new Cesium.ClippingPlane(planenorth2, (dis3_12camera-dis0_12camera)*(dis3_12camera/Math.abs(dis3_12camera))));

     var dis5_14camera=getPointToPlane(localpoi5,localpoi1,localpoi4,localpoicamera);
     var dis0_14camera=getPointToPlane(localpoi0,localpoi1,localpoi4,localpoicamera);

     var planenorth3=new Cesium.Cartesian3(
         (localpoi4.y-localpoi1.y)*(localpoicamera.z-localpoi1.z)-(localpoi4.z-localpoi1.z)*(localpoicamera.y-localpoi1.y),
         (localpoi4.z-localpoi1.z)*(localpoicamera.x-localpoi1.x)-(localpoi4.x-localpoi1.x)*(localpoicamera.z-localpoi1.z),
         (localpoi4.x-localpoi1.x)*(localpoicamera.y-localpoi1.y)-(localpoi4.y-localpoi1.y)*(localpoicamera.x-localpoi1.x)
     );
     planenorth3=Cesium.Cartesian3.normalize(planenorth3,planenorth3);
     var scaleplanenorth3=new Cesium.Cartesian3();
     scaleplanenorth3=Cesium.Cartesian3.multiplyByScalar(planenorth3,dis5_14camera,scaleplanenorth3);
     planenorth3=Cesium.Cartesian3.normalize(scaleplanenorth3,planenorth3);

     var scaleplanenorth4=new Cesium.Cartesian3();
     scaleplanenorth4=Cesium.Cartesian3.multiplyByScalar(scaleplanenorth3,-1,scaleplanenorth4);
     var planenorth4=new Cesium.Cartesian3();
     planenorth4=Cesium.Cartesian3.normalize(scaleplanenorth4,planenorth4);

     clippingplanes.push(new Cesium.ClippingPlane(planenorth3, dis0_14camera*(dis5_14camera/Math.abs(dis5_14camera))));
     clippingplanes.push(new Cesium.ClippingPlane(planenorth4, (dis5_14camera-dis0_14camera)*(dis5_14camera/Math.abs(dis5_14camera))));


     return clippingplanes;

     // return [
     //     new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 40.0),//留上半部分
     //     new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, -1.0, 0.0), 40.0),//留下半部分
     //     new Cesium.ClippingPlane(new Cesium.Cartesian3(-1.0, 0.0, 0.0), 40.0),//留左边
     //     new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), 40.0)//留右边
     // ];


 }
function getClippingPlanes() {
    // var catesianpos1=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowpos1.x,windowpos1.y);
    // var catesianpos2=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowpos2.x,windowpos2.y);
    // var catesianpos3=cesiumviewer.CesiumViewer.getInstance().GetCartesianFromWindowpos(windowpos3.x,windowpos3.y);
    var catesianpos0=pointcloudprimitive.boundingSphere.center;
    var catesiancamera=cesiumviewer.CesiumViewer.getInstance().GetViewerByContainerid().camera.position;

    // var cartesianxl1=new Cesium.Cartesian3();
    // var cartesianxl2=new Cesium.Cartesian3();
    // var cartesianxl3=new Cesium.Cartesian3();
    // var cartesianxlcamera=new Cesium.Cartesian3();
    //
    // cartesianxl1=Cesium.Cartesian3.subtract(catesianpos1,catesianpos0,cartesianxl1);
    // cartesianxl2=Cesium.Cartesian3.subtract(catesianpos2,catesianpos0,cartesianxl2);
    // cartesianxl3=Cesium.Cartesian3.subtract(catesianpos3,catesianpos0,cartesianxl3);
    // cartesianxlcamera=Cesium.Cartesian3.subtract(catesiancamera,catesianpos0,cartesianxlcamera);

    //var center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
    //var transform = Cesium.Transforms.eastNorthUpToFixedFrame(catesianpos0)



    var localpoi1=coordinate.CoordinateLocal.FromCartesian(mouseclickcartesianpos1,catesianpos0);
    var localpoi2=coordinate.CoordinateLocal.FromCartesian(mousemoveovercartesianpos2,catesianpos0);
    var localpoi3=coordinate.CoordinateLocal.FromCartesian(mousemoveovercartesianpos3,catesianpos0);
    var localpoicamera=coordinate.CoordinateLocal.FromCartesian(catesiancamera,catesianpos0);


    var dx1_2=localpoi2.x-localpoi1.x;
    var dy1_2=localpoi2.y-localpoi1.y;
    var d1_2=Math.sqrt(dx1_2*dx1_2+dy1_2*dy1_2);
    var d0_12=(localpoi1.y*dx1_2-localpoi1.x*dy1_2)/d1_2;
    var d3_12=(localpoi3.x*dy1_2-localpoi3.y*dx1_2+localpoi1.y*dx1_2-localpoi1.x*dy1_2)/d1_2;


    var clippingplanes=[];


    // var planenorth1=new Cesium.Cartesian3(
    //     (catesianpos2.y-catesianpos1.y)*(catesiancamera.z-catesianpos1.z)-(catesianpos2.z-catesianpos1.z)*(catesiancamera.y-catesianpos1.y),
    //     (catesianpos2.z-catesianpos1.z)*(catesiancamera.x-catesianpos1.x)-(catesianpos2.x-catesianpos1.x)*(catesiancamera.z-catesianpos1.z),
    //     (catesianpos2.x-catesianpos1.x)*(catesiancamera.y-catesianpos1.y)-(catesianpos2.y-catesianpos1.y)*(catesiancamera.x-catesianpos1.x)
    // )
    var planenorth1=new Cesium.Cartesian3(
            (localpoi2.y-localpoi1.y)*(localpoicamera.z-localpoi1.z)-(localpoi2.z-localpoi1.z)*(localpoicamera.y-localpoi1.y),
            (localpoi2.z-localpoi1.z)*(localpoicamera.x-localpoi1.x)-(localpoi2.x-localpoi1.x)*(localpoicamera.z-localpoi1.z),
            (localpoi2.x-localpoi1.x)*(localpoicamera.y-localpoi1.y)-(localpoi2.y-localpoi1.y)*(localpoicamera.x-localpoi1.x)
    )
    planenorth1=Cesium.Cartesian3.normalize(planenorth1,planenorth1);
    var scaleplanenorth1=new Cesium.Cartesian3();
    scaleplanenorth1=Cesium.Cartesian3.multiplyByScalar(planenorth1,Math.abs(d3_12),scaleplanenorth1);

    var planenorth2=new Cesium.Cartesian3(
        (localpoi1.y-localpoi2.y)*(localpoicamera.z-localpoi2.z)-(localpoi1.z-localpoi2.z)*(localpoicamera.y-localpoi2.y),
        (localpoi1.z-localpoi2.z)*(localpoicamera.x-localpoi2.x)-(localpoi1.x-localpoi2.x)*(localpoicamera.z-localpoi2.z),
        (localpoi1.x-localpoi2.x)*(localpoicamera.y-localpoi2.y)-(localpoi1.y-localpoi2.y)*(localpoicamera.x-localpoi2.x)
    );
    planenorth2=Cesium.Cartesian3.normalize(planenorth2,planenorth2);
    var scaleplanenorth2=new Cesium.Cartesian3();
    scaleplanenorth2=Cesium.Cartesian3.multiplyByScalar(planenorth2,Math.abs(d3_12),scaleplanenorth2);

    var localpoi4=new Cesium.Cartesian3();
    var localpoi5=new Cesium.Cartesian3();
    if(d3_12>0) //3在向量1-2的右边
    {
        // localpoi4=Cesium.Cartesian3.add(localpoi1,planenorth1,localpoi4);
        // localpoi5=Cesium.Cartesian3.add(localpoi2,planenorth1,localpoi5);
        localpoi4=Cesium.Cartesian3.add(localpoi1,scaleplanenorth1,localpoi4);
        localpoi5=Cesium.Cartesian3.add(localpoi2,scaleplanenorth1,localpoi5);

        clippingplanes.push(new Cesium.ClippingPlane(planenorth1, d0_12));
        clippingplanes.push(new Cesium.ClippingPlane(planenorth2, 0-(d0_12-d3_12)));


        // //第三个点在1-2点组成的法线同方向
        // return [
        //     //new Cesium.ClippingPlane(planenorth1, 0.0),
        //     new Cesium.ClippingPlane(planenorth1, d0_12),
        //     new Cesium.ClippingPlane(planenorth2, 0-(d0_12-d3_12)),
        // ];
    }
    else{
        // localpoi4=Cesium.Cartesian3.add(localpoi1,planenorth2,localpoi4);
        // localpoi5=Cesium.Cartesian3.add(localpoi2,planenorth2,localpoi5);
        localpoi4=Cesium.Cartesian3.add(localpoi1,scaleplanenorth2,localpoi4);
        localpoi5=Cesium.Cartesian3.add(localpoi2,scaleplanenorth2,localpoi5);

        clippingplanes.push(new Cesium.ClippingPlane(planenorth2, 0-d0_12));
        clippingplanes.push(new Cesium.ClippingPlane(planenorth1, d0_12-d3_12));
        //第三个点在1-2点组成的法线反方向
        // return [
        //     //new Cesium.ClippingPlane(planenorth1, 0.0),
        //     new Cesium.ClippingPlane(planenorth2, 0-d0_12),
        //     new Cesium.ClippingPlane(planenorth1, d0_12-d3_12),
        // ];
    }



    mousemovecartesianpos4=coordinate.CoordinateLocal.ToCartesian(localpoi4,catesianpos0);
    mousemovecartesianpos5=coordinate.CoordinateLocal.ToCartesian(localpoi5,catesianpos0);


    // if(localpoi4.x!=localpoi1.x||localpoi4.y!=localpoi1.y)
    // {
    //     var ttt=getlocalcoordinate(mousemovecartesianpos4,catesianpos0);
    // }



    var planenorth3=new Cesium.Cartesian3(
        (localpoi4.y-localpoi1.y)*(localpoicamera.z-localpoi1.z)-(localpoi4.z-localpoi1.z)*(localpoicamera.y-localpoi1.y),
        (localpoi4.z-localpoi1.z)*(localpoicamera.x-localpoi1.x)-(localpoi4.x-localpoi1.x)*(localpoicamera.z-localpoi1.z),
        (localpoi4.x-localpoi1.x)*(localpoicamera.y-localpoi1.y)-(localpoi4.y-localpoi1.y)*(localpoicamera.x-localpoi1.x)
    );
    planenorth3=Cesium.Cartesian3.normalize(planenorth3,planenorth3);

    var planenorth4=new Cesium.Cartesian3(
        (localpoi1.y-localpoi4.y)*(localpoicamera.z-localpoi4.z)-(localpoi1.z-localpoi4.z)*(localpoicamera.y-localpoi4.y),
        (localpoi1.z-localpoi4.z)*(localpoicamera.x-localpoi4.x)-(localpoi1.x-localpoi4.x)*(localpoicamera.z-localpoi4.z),
        (localpoi1.x-localpoi4.x)*(localpoicamera.y-localpoi4.y)-(localpoi1.y-localpoi4.y)*(localpoicamera.x-localpoi4.x)
    );
    planenorth4=Cesium.Cartesian3.normalize(planenorth4,planenorth4);

    var dx1_4=localpoi4.x-localpoi1.x;
    var dy1_4=localpoi4.y-localpoi1.y;
    var d1_4=Math.sqrt(dx1_4*dx1_4+dy1_4*dy1_4);
    var d0_14=(localpoi1.y*dx1_4-localpoi1.x*dy1_4)/d1_4;
    var d5_14=(localpoi5.x*dy1_4-localpoi5.y*dx1_4+localpoi1.y*dx1_4-localpoi1.x*dy1_4)/d1_4;

    //clippingplanes.push(new Cesium.ClippingPlane(planenorth3, 0));
    if(d5_14>0) //5在向量1-4的右边
    {
        clippingplanes.push(new Cesium.ClippingPlane(planenorth3, d0_14));
        clippingplanes.push(new Cesium.ClippingPlane(planenorth4, 0-(d0_14-d5_14)));
    }
    else{
        clippingplanes.push(new Cesium.ClippingPlane(planenorth4, 0-d0_14));
        clippingplanes.push(new Cesium.ClippingPlane(planenorth3, d0_14-d5_14));
        //第三个点在1-2点组成的法线反方向
        // return [
        //     //new Cesium.ClippingPlane(planenorth1, 0.0),
        //     new Cesium.ClippingPlane(planenorth2, 0-d0_12),
        //     new Cesium.ClippingPlane(planenorth1, d0_12-d3_12),
        // ];
    }



    //return clippingplanes;

    // return [
    //     //new Cesium.ClippingPlane(planenorth1, 0.0),
    //     // new Cesium.ClippingPlane(planenorth1, d0_12),
    //     new Cesium.ClippingPlane(planenorth1, d3_12),
    // ];

    return
    [
        new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 80.0),//留上半部分
        new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, -1.0, 0.0), 80.0),//留下半部分
        new Cesium.ClippingPlane(new Cesium.Cartesian3(-1.0, 0.0, 0.0), 80.0),//留左边
        new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), 80.0),//留右边
    ];
}

function getPointToPlane(poi,poi1,poi2,poi3) {
    var param=getPlaneParam(poi1,poi2,poi3);
    return (param[0]*poi.x+param[1]*poi.y+param[2]*poi.z+param[3])/Math.sqrt(param[0]*param[0]+param[1]*param[1]+param[2]*param[2]);
}
//获取平面方程//Ax + By + Cz + D
function getPlaneParam(poi1,poi2,poi3)
{
    if(!poi1||!poi2||!poi3)
    {
        return null;
    }
    var result=[];
    var x1 = poi1.x;
    var x2 = poi2.x;
    var x3 = poi3.x;
    var y1 = poi1.y;
    var y2 = poi2.y;
    var y3 = poi3.y;
    var z1 = poi1.z;
    var z2 = poi2.z;
    var z3 = poi3.z;
    var A = y1*(z2-z3)+y2*(z3-z1)+y3*(z1-z2);
    var B = z1*(x2-x3)+z2*(x3-x1)+z3*(x1-x2);
    var C = x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2);
    var D = -(x1*(y2*z3-y3*z2)+ x2*(y3*z1-y1*z3) + x3*(y1*z2 -y2*z1) );
    result.push(A);
    result.push(B);
    result.push(C);
    result.push(D);
    return result;
}


function pointzoomto() {

    if(pointcloudprimitive)
    {
        pointcloudprimitive.readyPromise.then(function(tileset) {
            cesiumviewer.CesiumViewer.getInstance().ZoomTo(tileset,new Cesium.HeadingPitchRange(0, -0.8, tileset.boundingSphere.radius * 2.8));
        }).otherwise(function(error) {
            console.log(error);
        });
    }
}

function pointsectionzoomto() {
    if(pointcloudPrimitivewithclip)
    {
        pointcloudPrimitivewithclip.readyPromise.then(function (tileset) {
            //cesiumviewer.CesiumViewer.getInstance().ZoomTo(tileset,new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), tileset.boundingSphere.radius * 1.3),PointCloudSectionContainerID);
           var center=new Cesium.Cartesian3();
           var heading=0;
           var cartesian0=tileset.boundingSphere.center;
           //var local1=getlocalcoordinate(mouseclickcartesianpos1,cartesian0);
           //var local2=getlocalcoordinate(mousemoveovercartesianpos2,cartesian0);

            var local1=coordinate.CoordinateLocal.FromCartesian(mouseclickcartesianpos1,cartesian0);
            var local2=coordinate.CoordinateLocal.FromCartesian(mousemoveovercartesianpos2,cartesian0);

           var heading=Math.asin((local2.y-local1.y)/Math.sqrt((local1.x-local2.x)*(local1.x-local2.x)+(local1.y-local2.y)*(local1.y-local2.y)));
           //下面根据dx符号分开处理的原因是反正弦函数不是在正弦函数的周期中唯一对应的
           if((local2.x-local1.x)>0)
               heading=0-heading;
           else{
               if(heading>0)
               {
                   heading=heading-Cesium.Math.toRadians(180);
               }
               else{
                   heading=heading+Cesium.Math.toRadians(180);
               }
           }

           // if(local1.y!=local2.y)
           // {
           //     heading=Math.atan((local2.x-local1.x)/(local2.y-local1.y))-Cesium.Math.toRadians(90);
           // }

           var center1_5=new Cesium.Cartesian3();
           var center2_4=new Cesium.Cartesian3();
           center1_5=Cesium.Cartesian3.lerp(mouseclickcartesianpos1,mousemovecartesianpos5,0.5,center1_5);
           center2_4=Cesium.Cartesian3.lerp(mousemoveovercartesianpos2,mousemovecartesianpos4,0.5,center2_4);
           center=Cesium.Cartesian3.lerp(center1_5,center2_4,0.5,center);
           //center.z=tileset.boundingSphere.center.z;
            //center.z+=95;

            pointCloudSectionViewer.camera.lookAt(center,new Cesium.HeadingPitchRange(heading, Cesium.Math.toRadians(0), Cesium.Cartesian3.distance(mouseclickcartesianpos1,mousemoveovercartesianpos2)*1.1));
        }).otherwise(function(error) {
            console.log(error);
        });
    }
}

function setpointcloud() {
    if(!pointcloudprimitive)
    {
        //添加primitive
        pointcloudprimitive=cesiumviewer.CesiumViewer.getInstance().AddPrimitive(new Cesium.Cesium3DTileset({
            url: globalconfig.configdata.modules.PointCloud.url,
            classificationType:Cesium.ClassificationType.TERRAIN,

        }));
    }
}

function setpointcloudsection() {
    var clippingplanes=getClippingPlanes1();
    if(!pointcloudPrimitivewithclip)
    {
        pointcloudPrimitivewithclip=cesiumviewer.CesiumViewer.getInstance().AddPrimitive(new Cesium.Cesium3DTileset({
            url: globalconfig.configdata.modules.PointCloud.url,
            classificationType:Cesium.ClassificationType.TERRAIN,
            clippingPlanes:new Cesium.ClippingPlaneCollection({
                planes : clippingplanes,
                unionClippingRegions:true,
                //edgeWidth:10,
                //edgeColor:Cesium.Color.BLUEVIOLET
            })
        }),PointCloudSectionContainerID);



    }
    else {
        pointcloudPrimitivewithclip.clippingPlanes=new Cesium.ClippingPlaneCollection({
            planes : clippingplanes,
            unionClippingRegions:true,
            //edgeWidth:10,
            //edgeColor:Cesium.Color.BLUEVIOLET
        });



    }

    //原来点云的样式设置给新的section样式
    var stylenew=pointcloudprimitive.style;
    stylenew.readyPromise.then(function (style) {
        pointcloudPrimitivewithclip.style=style;
    }).otherwise(function(error) {
        console.log(error);
    });
}

function setPointSectionViewer() {
    if(!pointCloudSectionViewer){
        cesiumviewer.CesiumViewer.getInstance().RegisterOverView(PointCloudSectionContainerID,
            {
                timeline: false,//下方时间轴
                animation: false,//左下角大圆盘
                navigationHelpButton: false,//帮助按钮
                sceneModePicker: false,//切换平坦模式和球状模式的按钮
                homeButton: false,//home按钮
                geocoder: false,//查询按钮
                baseLayerPicker: false,//地图切换按钮
                fullscreenButton:false,
                // imageryProvider:new Cesium.MapboxImageryProvider({
                //     mapId: 'mapbox.dark',
                //     // accessToken: '你的token'
                // }),
                // imageryProvider: new Cesium.SingleTileImageryProvider({
                //     url:"http://localhost:8080/gis/static/data/imagery/black/black.png"
                // })


            }
        );
        pointCloudSectionViewer=cesiumviewer.CesiumViewer.getInstance().GetViewerByContainerid(PointCloudSectionContainerID);
        pointCloudSectionViewer.scene.skyBox.show = false;
        pointCloudSectionViewer.scene.sun.show=false;
        pointCloudSectionViewer.scene.sunBloom=false;
        pointCloudSectionViewer.scene.globe.show=false;
        pointCloudSectionViewer.scene.skyAtmosphere.show = false;

    }
}

function refreshPointCloudSection() {
    if(!pointcloudprimitive) return;//原始点云没有添加，返回
    setPointSectionViewer();//初始化剖面显示的cesium viewer

    setpointcloudsection();

    pointsectionzoomto();


}

function ClearPointCloud() {
    if(pointcloudprimitive)
    {
        cesiumviewer.CesiumViewer.getInstance().RemovePrimitive(pointcloudprimitive);
        pointcloudprimitive=null;
    }
}

function ClearPointSectionCloud() {
    if(pointcloudPrimitivewithclip&&pointCloudSectionViewer){
        pointCloudSectionViewer.scene.primitives.remove(pointcloudPrimitivewithclip);
    }
}

function ClearEntity() {
    cesiumviewer.CesiumViewer.getInstance().RemoveEntityById(pointsectionentityid);
}


export default {
    HandleClassByElevation,
    HandleClassByIntensity,
    HandleClassByRGB,
    HandleClassByClassification,
    HandleClassByNumberofReturns,
    SetPointSize,
    ClearPointCloud,
    ClearPointSectionCloud,
    ClearEntity,
    HandleLeftClickFirst,
    HandleLeftClickSecond,
    HandleLeftClickThird,
    HandleMouseMoveBeforeSecondClick,
    HandleMouseMoveBeforeThirdClick,


    PointCloudSectionContainerID
}
