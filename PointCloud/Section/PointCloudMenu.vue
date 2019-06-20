<template>
    <div>
        <partcomwithborder v-show="isShow" classname="position-marginallauto" subclassname="MenuContainer" id="PointCloudMenu">
            <div class="SubContainer_ThreeButtonWithHalo float-left">
                <div class="MenuSubLabel color-white FontSize-16px textalign-left">点云</div>
                <div class="float-left margin-top10px" style="margin-left: 24px">
                    <input type="image" class="horizon-center position-relative MenuSubicon" src="static/images/modules/PointCloud/Classify.svg" @click="toggle_classify_visible" />
                    <div class="color-white FontSize-14px">点云分类</div>
                </div>
                <div class="float-left margin-top10px" style="margin-left: 46px" >
                    <input type="image" class="horizon-center position-relative MenuSubicon" :src="startdrawsection?'static/images/modules/PointCloud/Section_selected.svg':'static/images/modules/PointCloud/Section.svg'" @click="drawsection"/>
                    <div class="color-white FontSize-14px" >剖面绘制</div>
                </div>
                <div class="float-left margin-top10px" style="margin-left: 56px" >
                    <input type="image" class="horizon-center position-relative MenuSubicon" src="static/images/common/cleargraphic.svg" @click="clearsection"/>
                    <div class="color-white FontSize-14px" >清除</div>
                </div>
            </div>
        </partcomwithborder>
        <pointclassify ref="pointclassify"></pointclassify>
        <pointsection ref="pointsection"></pointsection>
    </div>
</template>

<script>
    import basemixin from '../../../common/buss/util/baseMixins'
    import Partcomwithborder from "../../../common/components/UtilityCom/partcomwithborder";
    import pointclassify from './PointClassification'
    import pointsection from './PointSection'
    import pointhandler from '../buss/PointClassificationHandler'
    import Bus from '../../../common/buss/util/bus'

    export default {
        name: "PointCloudMenu",
        components: {Partcomwithborder,"pointclassify":pointclassify,"pointsection":pointsection},
        mixins:[basemixin.DATA_ISSHOW,basemixin.COMPONENTS_PARTCOMWITHBORDER],
        data(){
            return {

                startdrawsection:false,
                leftclicknum:0,
            }
        },
        mounted(){
            var that=this;
            Bus.$on("Scene_Mouse_Left_Click",function (movement) {
                if(!that.isShow) return;
                if(!that.startdrawsection) return;
                that.leftclicknum++;
                if(that.leftclicknum%3==1)
                {
                    pointhandler.HandleLeftClickFirst(movement.position);
                }
                else if(that.leftclicknum%3==2)
                {
                    pointhandler.HandleLeftClickSecond(movement.position);
                }
                else{
                    pointhandler.HandleLeftClickThird(movement.position);
                    that.$refs.pointsection.isShow=true;
                }
            });

            Bus.$on("Scene_Mouse_Move",function (movement) {
                if(that.leftclicknum%3==1)
                {
                    pointhandler.HandleMouseMoveBeforeSecondClick(movement.endPosition);
                }
                else if(that.leftclicknum%3==2){
                    pointhandler.HandleMouseMoveBeforeThirdClick(movement.endPosition);
                }
            });
        },
        methods:{
            toggle_classify_visible:function () {
                this.$refs.pointclassify.isShow=!this.$refs.pointclassify.isShow;
            },
            drawsection:function () {
                this.startdrawsection=!this.startdrawsection;
                this.leftclicknum=0;
                //this.$refs.pointsection.isShow=!this.$refs.pointsection.isShow;
            },
            clearsection:function () {
                    pointhandler.ClearEntity();
                    this.leftclicknum=0;
                    this.$refs.pointsection.isShow=false;
            }


        },
        watch:{
            isShow(newval,oldval){
                if(!newval){
                    this.$refs.pointclassify.isShow=false;
                    this.$refs.pointsection.isShow=false;
                    this.startdrawsection=false;
                    this.clearsection();
                }
            },


        }

    }
</script>

<style scoped>


</style>

<style>
    @import "../../common/assets/css/moduleStyle.css";
    @import "../assets/css/PointCloudStyle.css";
</style>
