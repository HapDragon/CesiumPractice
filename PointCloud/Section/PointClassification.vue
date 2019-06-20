<template>
    <dialogcomwithborder :width=264 :height=414 :left=375 :top=200 :resizable=false v-show="isShow" :onclose-callback="close" title="点云">
        <div style="height: 300px;" class="width100percent">
            <div class="margin-top22px" style="margin-left: 27px;height:20px;">
                <div class="color-white float-left FontSize-14px" style="width:53px;">显示</div>
                <el-select v-model="currentclassificationtpe" placeholder="请选择"
                           class="pointclassificationtypeselect float-left whiteborder1PX transparentBk color-white FontSize-14px"
                           style="border-radius: 4px;width: 126px; height:20px;">
                    <el-option
                        v-for="item in classificationtype"
                        :key="item.value"
                        :label="item.name"
                        :value="item.value">
                    </el-option>
                </el-select>
            </div>
            <div class="margin-top8px" style="margin-left: 27px;height:20px;">
                <div class="color-white float-left FontSize-14px" style="width:53px;">点大小</div>
                <el-input-number v-model="pointsize" controls-position="right" :precision="1"
                                 :step="0.1" :max="15" :controls="true" :min="1"
                                 @change="handlepointsizechanged"
                                 class="pointsizeinput float-left whiteborder1PX transparentBk color-white"
                                 style="border-radius: 4px;width: 126px; height:20px;"></el-input-number>
            </div>
            <div class="display-block" style="margin-left:20px;margin-right:16px;margin-top: 16px;height:30px;">
                <span class="color-white FontSize-16px float-left">分类过滤</span>
                <input type="image" :src="filterAllSelected ? 'static/images/common/SelectAll.png': 'static/images/common/clearAllSelected.png'"  @click="togglefilterallselected" class="float-right"/>

            </div>

            <div class="selfdefine_scrollheight overflow_x-hidden bk-13213ccc display-block" style="height:170px;margin-left: 20px;margin-right:16px;">
                <div v-for="(item,index) in CurrentFilter" class="display-block" style="height: 26px;">
                    <input type="checkbox" class="ListCheckBox float-left margin-left8px" style="margin-top:3px;" :checked="item.checked" @click="filtercheckclick(item)"/>
                    <!--<el-color-picker v-model="item.showcolor"-->
                                     <!--class="inputcolorpicker float-left whiteborder1PX transparentBk color-white margin-left8px"-->
                                     <!--style="width:60px;height:20px;">-->
                    <!--</el-color-picker>-->
                    <!--<input type="text" :name=colorpickername(item) data-palette='["#D50000","#304FFE","#00B8D4","#69F0AE","#FFFF00"]' value="#00B8D4" style="display:none;">-->
                    <input style="width:1px;display:none;" :id=colorpickername(item) :value="CurrentColor(item)"/>
                    <div :class="item.checked?'color-yellow FontSize-14px margin-left8px float-left':'color-white FontSize-14px margin-left8px float-left'">{{item.name}}</div>
                </div>
            </div>
        </div>
        <img src="static/images/common/halo_232X2.png" class="width100percent">
        <div style="height:50px;" class="width100percent">
            <input type="button" value="应 用" class="bordernone horizon-center position-relative margin-top10px color-white browseokbutton80-30">
        </div>
    </dialogcomwithborder>
</template>

<script>
    import basemixins from '../../../common/buss/util/baseMixins'
    import Dialogcomwithborder from "../../../common/components/UtilityCom/dialogcomwithborder";
    import pointclasshandler from '../buss/PointClassificationHandler'
    import globalconfig from '../../../common/buss/util/globalConfig'
    import Bus from '../../../common/buss/util/bus'

    export default {
        name: "PointClassification",
        mixins:[basemixins.DATA_ISSHOW,basemixins.METHODS_CLOSE],
        components:{'dialogcomwithborder':Dialogcomwithborder},
        data(){
            return {
                leftclicknum:0,
                pointsize:1,
                currentclassificationtpe:0,
                classificationtype:[
                    {
                        value:0,
                        name:"暂未分类"
                    },
                    {
                        value:1,
                        name:"分类"//分类过滤可用 植被、房屋、水面
                    },
                    {
                        value:3,
                        name:"第几次回波"//分类过滤可用 只有一次回波 第一次回波 中间回波 最后一次回波
                    },
                    {
                        value:4,
                        name:"高程"//分类过滤不可用
                    },
                    {
                        value:5,
                        name:"强度"//分类过滤不可用
                    },
                    {
                        value:6,
                        name:"RGB真彩色"//分类过滤不可用
                    },
                ],

                invisibilitycolor: '#409EFF',
                CurrentFilterOptionIndex:-1,
                FilterOptions:[
                    //分类的枚举
                    [
                        {
                            value:1,
                            name:"未分类",
                            coloridx:36,
                            checked:true
                        },
                        {
                            value:2,
                            name:"地面",
                            coloridx:37,
                            checked:true
                        },
                        {
                            value:3,
                            name:"低矮植物",
                            coloridx:38,
                            checked:true
                        },
                        {
                            value:4,
                            name:"一般高度植物",
                            coloridx:39,
                            checked:true
                        },
                        {
                            value:5,
                            name:"高大植物",
                            coloridx:40,
                            checked:true
                        },
                        {
                            value:6,
                            name:"建筑",
                            coloridx:5,
                            checked:true
                        },
                        {
                            value:7,
                            name:"噪音",
                            coloridx:41,
                            checked:true
                        },
                        {
                            value:8,
                            name:"水面",
                            coloridx:42,
                            checked:true
                        },
                        // {
                        //     value:-1,
                        //     name:"其他",
                        //     coloridx:8,
                        //     checked:true
                        // }
                    ],
                    //暂时还不知道强度+分类如何添加枚举
                    [
                        {
                            value:6,
                            name:"建筑",
                            coloridx:5
                        },
                        {
                            value:7,
                            name:"噪音",
                            coloridx:6
                        },
                        {
                            value:8,
                            name:"水面",
                            coloridx:7
                        },
                        {
                            value:-1,
                            name:"其他",
                            coloridx:8
                        }
                    ],
                    //第几次回波的枚举
                    [

                        {
                            value:1,
                            name:"第一次回波",
                            coloridx:36,
                            checked:true
                        },
                        {
                            value:2,
                            name:"第二次回波",
                            coloridx:37,
                            checked:true
                        },
                        {
                            value:3,
                            name:"第三次回波",
                            coloridx:38,
                            checked:true
                        },
                        {
                            value:4,
                            name:"第四次回波",
                            coloridx:39,
                            checked:true
                        },
                        {
                            value:5,
                            name:"第五次回波",
                            coloridx:40,
                            checked:true
                        },
                        {
                            value:6,
                            name:"第六次回波",
                            coloridx:41,
                            checked:true
                        }
                    ]
                ]


            }
        },
        mounted(){
          pointclasshandler.SetPointSize(this.pointsize);

          // var that=this;
          //   Bus.$on("Scene_Mouse_Left_Click",function (movement) {
          //       that.leftclicknum++;
          //       if(that.leftclicknum%2>0)
          //       {
          //           pointclasshandler.HandleLeftClickFirst(movement.position);
          //       }
          //       else{
          //           pointclasshandler.HandleLeftClickSecond(movement.position);
          //       }
          //   });
        },
        computed:{
            colorpickername:function () {
                return function (item) {
                    return "UNIQUE_NAME"+item.value;
                }
            },

            CurrentFilter:function () {
                var result=[];
                if(this.CurrentFilterOptionIndex>=0)
                {
                    result = this.FilterOptions[this.CurrentFilterOptionIndex];

                    result.forEach(item=>{
                        item.checked=true;
                    });

                    this.refreshcolorpickers();
                   // this.pointcloudfiltershows();
                }

                return result;
            },

            CurrentColor:function () {
                return function (item) {
                    return globalconfig.themesdata.defaulttheme.colors[item.coloridx];
                }
            },

            filterAllSelected()
            {
                if(this.CurrentFilterOptionIndex<0) return false;
                var result=true
                for(var i=0;i<this.CurrentFilter.length;i++)
                {
                    if(!this.CurrentFilter[i].checked)
                    {
                        result=false;
                        return;
                    }
                }
                return result;
            },


        },

        methods:{
            handlepointsizechanged(){
                pointclasshandler.SetPointSize(this.pointsize);
            },

            refreshcolorpickers(){
                var that=this;
                $(document).ready(function() {
                    that.CurrentFilter.forEach(item=>{
                        $("#"+that.colorpickername(item)).colorpicker({
                           // defaultPalette: 'theme',
                          //  history: false,
                            showOn: "button",
                          //  strings: "主题颜色,标准颜色,网络颜色",
                           // initialHistory: ["#ff0000", "#00ff00", "#0000ff"],
                          //  customTheme: ['#f44336','#ff9800','#ffc107','#4caf50','#00bcd4','#3f51b5','#9c27b0','#5d8f06','#c76f00','#117879','#8c2113','#c1fcfd','#8bf9f3','#51edf7','#00dcd9','#00a19c','#00b7ee','#00a0e9','#0075a9', 'white', 'black'],
                            // color:'#f44336'
                            //transparentColor: true
                        });
                        $("#"+that.colorpickername(item)).on("change.color", function(event, color){
                           that.pointcloudfiltershows();
                        });
                    })
                    that.pointcloudfiltershows();
                });

            },
            filtercheckclick(item){
                item.checked=!item.checked;
                this.pointcloudfiltershows();
            },
            pointcloudfiltershows()
            {
                var filteritems=[];
                this.CurrentFilter.forEach(item=>{
                    if(item.checked)
                    {
                        filteritems.push({
                            value:item.value,
                            rgbcolor:$("#UNIQUE_NAME"+item.value).colorpicker("val")
                        })
                    }
                });
                if(this.currentclassificationtpe==1)
                {
                    pointclasshandler.HandleClassByClassification(filteritems);
                }
                else if(this.currentclassificationtpe==3)
                {
                    pointclasshandler.HandleClassByNumberofReturns(filteritems);
                }
            },

            togglefilterallselected:function () {
                if(this.CurrentFilterOptionIndex<0) return;
               var nowselectedall=this.filterAllSelected;
                this.CurrentFilter.forEach(item=>{
                    item.checked=!nowselectedall;
                });
                this.pointcloudfiltershows();

            }

        },
        watch:{
            isShow(newval,oldval)
            {
              if(!newval)
              {
                  pointclasshandler.ClearPointCloud();
                  this.currentclassificationtpe=0;
                  this.CurrentFilterOptionIndex=-1;
              }
            },
            currentclassificationtpe(newval,oldval)
            {
                this.CurrentFilterOptionIndex=-1;
                switch (newval) {
                    case 1:
                        this.CurrentFilterOptionIndex=0;
                        break;
                    case 3:
                        this.CurrentFilterOptionIndex=2;
                        break;
                    case 4:
                        pointclasshandler.HandleClassByElevation();
                        break;
                    case 5:
                        pointclasshandler.HandleClassByIntensity();
                        break;
                    case 6:
                        pointclasshandler.HandleClassByRGB();
                        break;
                    default:
                        break;
                }
            }
        }
    }
</script>

<style scoped>

</style>

<style>
    @import "../assets/css/PointCloudStyle.css";
</style>
