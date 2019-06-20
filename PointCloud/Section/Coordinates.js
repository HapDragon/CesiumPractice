//WGS84坐标系
import Cesium from 'cesium/Cesium'
function CoordinateWGS84(longitude,latitude,height) {
    this.longitude=longitude;
    this.latitude=latitude;
    this.height=height;
}

CoordinateWGS84.fromMercator=function(mercator){
    var x = mercator.Mercator_X / 20037508.34 * 180;
    var y = mercator.Mercator_Y / 20037508.34 * 180;
    y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
    return new CoordinateWGS84(x,y,mercator.height);
}
CoordinateWGS84.fromMercatorxyh=function(mercatorx,mercatory,height)
{
    return CoordinateWGS84.fromMercator(new CoordinateMercator(mercatorx,mercatory,height));
}
CoordinateWGS84.prototype.ToCartesian=function(){
    return Cesium.Cartesian3.fromDegrees(this.longitude, this.latitude, this.height);
}
CoordinateWGS84.fromCatesian=function(cartesian){
    var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
    return new CoordinateWGS84(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude),
        cartographic.height);
}
CoordinateWGS84.fromCatesianWithCartographic=function(cartesian){
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    return new CoordinateWGS84(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude),
        cartographic.height);
}

CoordinateWGS84.GetDistancePlane=function (poi1,poi2) {
    var coordinateMercator_poi1=CoordinateMercator.fromWGS84(poi1);
    var coordinateMercator_poi2=CoordinateMercator.fromWGS84(poi2);
    return CoordinateMercator.GetDistancePlane(coordinateMercator_poi1,coordinateMercator_poi2);
}

CoordinateWGS84.GetDistancePlaneWithLocal=function(poi1,poi2){
    var cartesianpoi1=poi1.ToCartesian();
    var cartesianpoi2=poi2.ToCartesian();
    return CoordinateLocal.GetDistancePlane(CoordinateLocal.FromCartesian(cartesianpoi1,cartesianpoi1),CoordinateLocal.FromCartesian(cartesianpoi2,cartesianpoi1));
}

CoordinateWGS84.GetDistance=function (poi1,poi2) {
    // var coordinateMercator_poi1=CoordinateMercator.fromWGS84(poi1);
    // var coordinateMercator_poi2=CoordinateMercator.fromWGS84(poi2);
    // return CoordinateMercator.GetDistance(coordinateMercator_poi1,coordinateMercator_poi2);

    var cartesianpoi1=poi1.ToCartesian();
    var cartesianpoi2=poi2.ToCartesian();
    return CoordinateLocal.GetDistance(CoordinateLocal.FromCartesian(cartesianpoi1,cartesianpoi1),CoordinateLocal.FromCartesian(cartesianpoi2,cartesianpoi1));
}

CoordinateWGS84.GetSquare=function (poi1,poi2,poi3) {
    var mer1=CoordinateMercator.fromWGS84(poi1);
    var mer2=CoordinateMercator.fromWGS84(poi2);
    var mer3=CoordinateMercator.fromWGS84(poi3);
    return CoordinateMercator.GetSquare(mer1,mer2,mer3);
}
CoordinateWGS84.GetSquareFromPois=function (pois) {
    // var poismer=[];
    // pois.forEach(poi=>{
    //     poismer.push(CoordinateMercator.fromWGS84(poi));
    // });
    // return CoordinateMercator.GetSquareFromPois(poismer);

    if(pois.length<=0) return 0;
    var poicar0=pois[0].ToCartesian();
    var poislocal=[];
    for(var i=0;i<pois.length;i++){
        poislocal.push(CoordinateLocal.FromCartesian(pois[i].ToCartesian(),poicar0));
    }
    return CoordinateLocal.GetSquare(poislocal);
}

//墨卡托投影坐标系
function CoordinateMercator(x,y,z) {
    this.Mercator_X=x;
    this.Mercator_Y=y;
    this.height=z;
}
CoordinateMercator.fromWGS84=function (wgs84) {
    var x = wgs84.longitude * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + wgs84.latitude) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return new CoordinateMercator(x,y,wgs84.height);
}
CoordinateMercator.fromWGS84longlatheight=function(longitude,latitude,height)
{
    return CoordinateMercator.fromWGS84(new CoordinateWGS84(longitude,latitude,height));
}

CoordinateMercator.GetDistancePlane=function (poi1,poi2) {
    var dx=poi1.Mercator_X-poi2.Mercator_X;
    var dy=poi1.Mercator_Y-poi2.Mercator_Y;
    return Math.sqrt(dx*dx+dy*dy);
}

CoordinateMercator.GetDistance=function (poi1,poi2) {
    var dz=poi1.height-poi2.height;
    var dplane=CoordinateMercator.GetDistancePlane(poi1,poi2);
    return Math.sqrt(dz*dz+dplane*dplane);
}

CoordinateMercator.GetSquare=function (poi1,poi2,poi3) {
    var len1=CoordinateMercator.GetDistance(poi1,poi2);
    var len2=CoordinateMercator.GetDistance(poi1,poi3);
    var len3=CoordinateMercator.GetDistance(poi2,poi3);
    var lenp=(len1+len2+len3)/2;
    return Math.sqrt(lenp*(lenp-len1)*(lenp-len2)*(lenp-len3));
}

CoordinateMercator.GetSquareFromPois=function (pois) {
    var result=0;
    for(var i=2;i<pois.length;i++)
    {
        var poi1=pois[0];
        var poi2=pois[i-1];
        var poi3=pois[i];
        result+=CoordinateMercator.GetSquare(poi1,poi2,poi3);
    }
    return result;
}


function CoordinateLocal(x,y,z) {
    this.x=x;
    this.y=y;
    this.z=z;
}
CoordinateLocal.FromCartesian=function (cartesianpoi,cartesian0) {
    var cartographic=Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian0);//经纬度弧度
    var m = new Cesium.Matrix4();
    var matrix=new Cesium.Matrix4(
        1,0,0,-cartesian0.x,
        0,1,0,-cartesian0.y,
        0,0,1,-cartesian0.z,
        0,0,0,1
    );//平移矩阵

    m = Cesium.Matrix4.multiplyByTranslation(matrix, cartesianpoi,m);//m = m X v
    var result=new Cesium.Cartesian3();
    result=Cesium.Matrix4.getTranslation(m,result);


    var matrix=new Cesium.Matrix4(
        -Math.sin(cartographic.longitude),Math.cos(cartographic.longitude),0,0,
        -Math.cos(cartographic.longitude),-Math.sin(cartographic.longitude),0,0,
        0,0,1,0,
        0,0,0,1
    );//绕z轴旋转90+longitude矩阵
    m = Cesium.Matrix4.multiplyByTranslation(matrix, result,m);
    result=Cesium.Matrix4.getTranslation(m,result);


    var matrix=new Cesium.Matrix4(
        1,0,0,0,
        0,Math.sin(cartographic.latitude),Math.cos(cartographic.latitude),0,
        0,-Math.cos(cartographic.latitude),Math.sin(cartographic.latitude),0,
        0,0,0,1
    );//绕x轴旋转90-latitude矩阵
    m = Cesium.Matrix4.multiplyByTranslation(matrix, result,m);
    result=Cesium.Matrix4.getTranslation(m,result);
    return new CoordinateLocal(result.x,result.y,result.z);
}
CoordinateLocal.ToCartesian=function(cartesianlocalpoi,cartesian0){
    var cartographic=Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian0);//笛卡尔转经纬度弧度
    var m = new Cesium.Matrix4();
    var matrix=new Cesium.Matrix4(
        1,0,0,0,
        0,Math.sin(cartographic.latitude),-Math.cos(cartographic.latitude),0,
        0,Math.cos(cartographic.latitude),Math.sin(cartographic.latitude),0,
        0,0,0,1
    );//绕x轴旋转latitude-90矩阵
    m = Cesium.Matrix4.multiplyByTranslation(matrix, cartesianlocalpoi,m);//m = m X v
    var result=new Cesium.Cartesian3();
    result=Cesium.Matrix4.getTranslation(m,result);

    var matrix=new Cesium.Matrix4(
        -Math.sin(cartographic.longitude),-Math.cos(cartographic.longitude),0,0,
        Math.cos(cartographic.longitude),-Math.sin(cartographic.longitude),0,0,
        0,0,1,0,
        0,0,0,1
    );//绕z轴旋转270-longitude矩阵
    m = Cesium.Matrix4.multiplyByTranslation(matrix, result,m);
    result=Cesium.Matrix4.getTranslation(m,result);


    var matrix=new Cesium.Matrix4(
        1,0,0,cartesian0.x,
        0,1,0,cartesian0.y,
        0,0,1,cartesian0.z,
        0,0,0,1
    );//平移矩阵
    m = Cesium.Matrix4.multiplyByTranslation(matrix, result,m);
    result=Cesium.Matrix4.getTranslation(m,result);
    return result;
}

CoordinateLocal.GetSquare=function (pois) {
    var result=0;
    for(var i=2;i<pois.length;i++){
        var poi1=pois[0];
        var poi2=pois[i-1];
        var poi3=pois[i];
        // result+=((poi2.X-poi1.X)*(poi3.X-poi1.X)+
        //     (poi2.Y-poi1.Y)*(poi3.Y-poi1.Y)+
        //     (poi2.Z-poi1.Z)*(poi3.Z-poi1.Z))/2;
        result+=((poi2.x-poi1.x)*(poi3.y-poi1.y)+(poi2.y-poi1.y)*(poi3.z-poi1.z)+(poi3.x-poi1.x)*(poi2.z-poi1.z)-
            (poi3.y-poi1.y)*(poi2.z-poi1.z)-(poi3.x-poi1.x)*(poi2.y-poi1.y)-(poi2.x-poi1.x)*(poi3.z-poi1.z))/2;
    }
    return Math.abs(result);
}

CoordinateLocal.GetDistance=function (localpoi1,localpoi2) {
    var dx=localpoi2.x-localpoi1.x;
    var dy=localpoi2.y-localpoi1.y;
    var dz=localpoi2.z-localpoi1.z;
    return Math.sqrt(dx*dx+dy*dy+dz*dz);
}
CoordinateLocal.GetDistancePlane=function (localpoi1,localpoi2) {
    var dx=localpoi2.x-localpoi1.x;
    var dy=localpoi2.y-localpoi1.y;
    return Math.sqrt(dx*dx+dy*dy);
}

export default {
    CoordinateWGS84,//WGS84坐标系
    CoordinateMercator,//墨卡托坐标系
    CoordinateLocal,//本地坐标系
}
